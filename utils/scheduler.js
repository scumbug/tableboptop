/* eslint-disable no-unused-vars */
const schedule = require('node-schedule');
const {
  serverStatus,
  initMerchants,
  buildMerchantEmbed,
  merchantAlerts,
} = require('./lostarkUtils');
const signalr = require('@microsoft/signalr');
const { MONITOR_PERIOD } = require('./constants');
const { merchantData, merchantFlag } = require('./helpers');
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
      console.log('Status not available, checking again in 1 min');
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
  signalrClient.serverTimeoutInMilliseconds = 8 * 60 * 1000;
  signalrClient.keepAliveIntervalInMilliseconds = 1 * 60 * 1000;

  // stops signalr after a cycle
  schedule.scheduleJob('55 * * * *', async () => {
    try {
      await signalrClient.stop();
    } catch (error) {
      console.log('Signalr client not running');
    }
  });

  // Runs monitoring every :30 past the hour
  schedule.scheduleJob('30 * * * *', async () => {
    // setup monitoring
    const channel = discordClient.channels.cache.get(process.env.MCTV2_CHN);
    const spawnTime = Date.now();
    const endTime = new Date(spawnTime + MONITOR_PERIOD);

    // instantiate new merchant cycle message
    const msgRef = await channel.send({ embeds: [await initMerchants(new Date(spawnTime))] });

    // start listening to data from lostmerchants
    console.log('Start monitoring Merchant votes');
    await signalrClient.start();
    await signalrClient.invoke('SubscribeToServer', process.env.LA_SERVER);

    // Monitor inc merchant, push to db, update embed
    signalrClient.on('UpdateMerchantGroup', async (_server, merchant) => {
      const curr = await merchantData.get(merchant.merchantName);
      await merchantData.set(
        merchant.merchantName,
        { ...curr, ...merchant },
        spawnTime + MONITOR_PERIOD - Date.now()
      );
      await msgRef.edit({ embeds: [await buildMerchantEmbed(spawnTime)] });
    });

    // Monitor inc votes, push to db, update embed, ping roles
    signalrClient.on('UpdateVotes', async (votes) => {
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
  });
};

module.exports = {
  runScheduler,
};
