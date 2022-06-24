const schedule = require('node-schedule');
const { serverStatus, buildMerchantEmbed, merchantAlertsV2 } = require('./lostarkUtils');
const signalr = require('@microsoft/signalr');
const { Client } = require('discord.js');
const { merchantList } = require('./constants');

const runScheduler = async (client) => {
  serverMonitor(client);
  merchantMonitor(client);
};

/**
 * Cronjob to monitor server uptime
 * @param {Client} client
 */
const serverMonitor = async (client) => {
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
  let signalrClient = new signalr.HubConnectionBuilder()
    .withUrl('https://lostmerchants.com/MerchantHub')
    .withAutomaticReconnect()
    .build();
  signalrClient.serverTimeoutInMilliseconds = 65000;
  await signalrClient.start();

  // setup merchant message
  const channel = discordClient.channels.cache.get(process.env.MCTV2_CHN);

  // Runs monitoring every :30 past the hour
  schedule.scheduleJob('30 * * * *', async () => {
    console.log('Start monitoring Merchant votes');
    const spawnTime = Date.now();
    const endTime = new Date(spawnTime + 24 * 60 * 1000);
    // instantiate new merchant cycle message
    const msgRef = await channel.send({ embeds: [await buildMerchantEmbed([], spawnTime)] });

    // Monitor votes for 24 mins every 10s
    schedule.scheduleJob({ end: endTime, rule: '*/10 * * * * *' }, async () => {
      await signalrClient
        .invoke('GetKnownActiveMerchantGroups', process.env.LA_SERVER)
        .then(async (data) => {
          try {
            // Grab latest merchant info
            const merchantEmbed = await buildMerchantEmbed(data, spawnTime);
            // Update embed
            await msgRef.edit({ embeds: [merchantEmbed] });
            // Ping roles
            await merchantAlertsV2(data, channel, spawnTime);
          } catch (error) {
            console.log(error);
          }
        });
    });
  });
};

module.exports = {
  runScheduler,
};
