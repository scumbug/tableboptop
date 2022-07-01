/* eslint-disable no-unused-vars */
const schedule = require('node-schedule');
const {
  serverStatus,
  initMerchants,
  buildMerchantEmbed,
  merchantAlerts,
  populateMerchants,
} = require('./lostarkUtils');
const signalr = require('@microsoft/signalr');
const { MONITOR_PERIOD } = require('./constants');
const { merchantData, merchantFlag, isSpawnCycle } = require('./helpers');
const all = require('it-all');
const { Client } = require('discord.js');

const runScheduler = (client) => {
  serverMonitor(client);
  merchantMonitor(client);
};

/**
 * Cronjob to monitor server uptime
 * @param {Client} client
 */
const serverMonitor = (client) => {
  schedule.scheduleJob('*/1 * * * *', async () => {
    try {
      const status = await serverStatus(process.env.LA_SERVER);
      const old = client.user.presence.activities[0].name;

      const channel = client.channels.cache.get(process.env.LA_CHN);

      // Ping on status change
      if (old.includes('Maint') && !status.includes('Maint')) {
        await channel.send('Server is up!');
      } else if (
        !old.includes('Maint') &&
        !old.includes('Initializing') &&
        status.includes('Maint')
      ) {
        await channel.send('Lost Ark went into maintenance');
      }
      // set new status
      client.user.setActivity(`Lost Ark | ${process.env.LA_SERVER}: ${status}`);
    } catch (error) {
      console.warn('Status not available, checking again in 1 min');
    }
  });
};

/**
 * Monitors all merchant spawns
 * @param {Client} discordClient
 */
const merchantMonitor = async (discordClient) => {
  // setup signalr
  const signalrClient = new signalr.HubConnectionBuilder()
    .withUrl('https://lostmerchants.com/MerchantHub')
    .withAutomaticReconnect()
    .build();
  signalrClient.serverTimeoutInMilliseconds = 15 * 60 * 1000;
  signalrClient.keepAliveIntervalInMilliseconds = 1 * 60 * 1000;

  // stops signalr after a cycle
  schedule.scheduleJob('55 * * * *', async () => {
    try {
      await signalrClient.off('UpdateMerchantGroup');
      await signalrClient.off('UpdateVotes');
      await signalrClient.stop();
    } catch (error) {
      console.log('Signalr client not running');
    }
  });

  // Runs monitoring every :30 past the hour
  const monitorJob = schedule.scheduleJob('30 * * * *', async () => {
    // setup monitoring
    const channel = discordClient.channels.cache.get(process.env.MCTV2_CHN);
    const spawnTime = new Date().setMinutes(30);
    const endTime = spawnTime + MONITOR_PERIOD;
    console.log(`New spawn cycle started at: ${new Date(spawnTime)}`);
    console.log(`Cycle will end at: ${new Date(endTime)}`);

    // Register Handlers

    // Monitor inc merchant, push to db, update embed
    signalrClient.on('UpdateMerchantGroup', async (_server, merchant) => {
      console.log('Received merchant group');
      const curr = await merchantData.get(merchant.merchantName);
      await merchantData.set(merchant.merchantName, { ...curr, ...merchant }, endTime - Date.now());
      await msgRef.edit({ embeds: [await buildMerchantEmbed(spawnTime)] });
    });

    // Monitor inc votes, push to db, update embed, ping roles
    signalrClient.on('UpdateVotes', async (votes) => {
      console.log('Received votes');
      Promise.all(
        votes.map(async (vote) => {
          (await all(merchantData.iterator())).map(async (merchant) => {
            const activeMerchant = merchant[1].activeMerchants.slice(-1)[0];
            if (activeMerchant && activeMerchant.id === vote.id) {
              activeMerchant.votes = vote.votes;
              await merchantData.set(merchant[0], merchant[1], endTime - Date.now());

              // ping roles
              if ((await merchantFlag.get(merchant[0])) === undefined && vote.votes > 7)
                await merchantAlerts(merchant[1], channel, spawnTime);
            }
          });
        })
      );
      await msgRef.edit({ embeds: [await buildMerchantEmbed(spawnTime)] });
    });

    // Repopulate db on connection lost
    signalrClient.onreconnected(async () => {
      console.log(endTime);
      console.log('Signalr reconnected, refreshing merchants');
      // Grab active merchants
      const activeMerchants = await signalrClient.invoke(
        'GetKnownActiveMerchantGroups',
        process.env.LA_SERVER
      );

      if (activeMerchants.length > 0)
        await populateMerchants(activeMerchants, endTime - Date.now());

      await msgRef.edit({ embeds: [await buildMerchantEmbed(spawnTime)] });
    });

    // start listening to data from lostmerchants
    console.log('Start listening');
    await signalrClient.start();
    await signalrClient.invoke('SubscribeToServer', process.env.LA_SERVER);

    // get known merchants
    const activeMerchants = await signalrClient.invoke(
      'GetKnownActiveMerchantGroups',
      process.env.LA_SERVER
    );

    // instantiate new merchant cycle message
    const msgRef = await channel.send({
      embeds: [await initMerchants(new Date(spawnTime), activeMerchants)],
    });
  });

  // start merchant monitoring immediately if bot starts within spawn cycle
  console.log(isSpawnCycle(new Date()));
  if (isSpawnCycle(new Date())) {
    console.log('Bot started within spawn cycle, manually invoking job');
    monitorJob.invoke();
  }
};

module.exports = {
  runScheduler,
};
