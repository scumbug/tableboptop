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
const {
  merchantData,
  merchantFlag,
  isSpawnCycle,
  merchantConf,
  getMerchantConfs,
} = require('./helpers');
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
  signalrClient.serverTimeoutInMilliseconds = 8 * 60 * 1000;
  signalrClient.keepAliveIntervalInMilliseconds = 1 * 60 * 1000;

  // setup discord channel
  const channel = discordClient.channels.cache.get(process.env.MCTV2_CHN);

  // Register Handlers
  // Monitor inc merchant, push to db, update embed
  signalrClient.on('UpdateMerchantGroup', async (_server, merchant) => {
    console.log('Received merchant group');
    const merchantConf = await getMerchantConfs();
    const curr = await merchantData.get(merchant.merchantName);
    await merchantData.set(
      merchant.merchantName,
      { ...curr, ...merchant },
      merchantConf.endTime - Date.now()
    );
    const msgRef = await channel.messages.fetch(merchantConf.msgRef);
    await msgRef.edit({ embeds: [await buildMerchantEmbed(merchantConf.spawnTime)] });
  });

  // Monitor inc votes, push to db, update embed, ping roles
  signalrClient.on('UpdateVotes', async (votes) => {
    console.log('Received votes');
    const merchantConf = await getMerchantConfs();
    Promise.all(
      votes.map(async (vote) => {
        (await all(merchantData.iterator())).map(async (merchant) => {
          const activeMerchant = merchant[1].activeMerchants[0];
          if (activeMerchant && activeMerchant.id === vote.id) {
            activeMerchant.votes = vote.votes;
            await merchantData.set(merchant[0], merchant[1], merchantConf.endTime - Date.now());

            // ping roles
            if ((await merchantFlag.get(merchant[0])) === undefined && vote.votes > 7)
              await merchantAlerts(merchant[1], channel, merchantConf.spawnTime);
          }
        });
      })
    );
    const msgRef = await channel.messages.fetch(merchantConf.msgRef);

    await msgRef.edit({ embeds: [await buildMerchantEmbed(merchantConf.spawnTime)] });
  });

  // Repopulate db on connection lost
  signalrClient.onreconnected(async () => {
    console.log('Signalr reconnected, resubscribing to server');
    await signalrClient.invoke('SubscribeToServer', process.env.LA_SERVER);
  });

  // Init merchants when spawn cycle starts
  const initMerchantJob = schedule.scheduleJob('29 * * * *', async () => {
    // setup conf
    const spawnTime = new Date().setMinutes(30);
    merchantConf.set('spawnTime', spawnTime);
    merchantConf.set('endTime', spawnTime + MONITOR_PERIOD);
    console.log(`New spawn cycle started at: ${new Date(spawnTime)}`);
    console.log(`Cycle will end at: ${new Date(spawnTime + MONITOR_PERIOD)}`);

    // get known merchants
    const activeMerchants = await signalrClient.invoke(
      'GetKnownActiveMerchantGroups',
      process.env.LA_SERVER
    );

    // instantiate new merchant cycle message
    if ((await merchantConf.get('msgRef')) !== undefined) {
      const msgRef = await channel.messages.fetch(await merchantConf.get('msgRef'));
      await msgRef.edit({ embeds: [await initMerchants(new Date(spawnTime), activeMerchants)] });
    } else {
      const msgRef = await channel.send({
        embeds: [await initMerchants(new Date(spawnTime), activeMerchants)],
      });
      await merchantConf.set('msgRef', msgRef.id);
    }
  });

  // Manual KeepAlive every 2 minutes
  schedule.scheduleJob('*/2 * * * *', async () => {
    try {
      await signalrClient.invoke('HasNewerClient', 1);
    } catch (error) {
      console.log('Signalr not running');
    }
  });

  // start listening to data from lostmerchants
  console.log('Start listening');
  await signalrClient.start();
  await signalrClient.invoke('SubscribeToServer', process.env.LA_SERVER);

  // Init merchants if bot starts/restarts in the middle of spawn cycle
  if (isSpawnCycle(new Date())) {
    console.log('Bot started within spawn cycle, manually invoking job');
    initMerchantJob.invoke();
  }
};

module.exports = {
  runScheduler,
};
