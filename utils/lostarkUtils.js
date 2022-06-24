const { MessageEmbed, Client } = require('discord.js');
const fetch = require('node-fetch');
const parser = require('node-html-parser');
const { itemList, URL_REGEX, NAME_CLASS, STATUS_CLASSES, IMAGE_URL } = require('./constants');
const { merchantFlag } = require('./helpers');

/**
 * Returns lost ark server status
 * @param {string} name
 * @returns {string}
 */
const serverStatus = async (name) => {
  const rawHTML = await fetch('https://www.playlostark.com/en-us/support/server-status');

  const root = parser.parse(await rawHTML.text());

  const server = root
    .querySelectorAll(NAME_CLASS)
    .find((serverBlock) => serverBlock.text.trim() === name);

  return STATUS_CLASSES.find((status) => server.parentNode.querySelector(status))
    .split('-')
    .at(-1)
    .slice(0, 5)
    .replace(/\b\w/, (c) => c.toUpperCase());
};

/**
 * Card Pinger Function
 * @param {Message} message
 * @param {Client} client
 */
const merchantAlerts = async (message, client) => {
  const s = message.embeds[0].description.split('\n');

  // build embed payload
  const details = {
    item: s[s.findIndex((l) => l.includes('**Item**')) + 1].slice(0, -3),
    location: s.find((l) => l.includes('**Location**')),
    spawned: s.find((l) => l.includes('**Spawned**')),
    orig: message.url,
  };

  // add map img to payload
  details.image = details.location.match(URL_REGEX)[0];

  // log pings
  console.log(`INFO: ${details.item} popped`);

  try {
    const channel = client.channels.cache.get(process.env.ANN_CHN);

    const role = itemList
      .filter((item) => details.item.includes(item.itemName))
      .map(({ role }) => role)
      .join('');

    if (!role) throw `WARN: Role for ${details.item} is undefined`;
    else
      return await channel.send({
        content: role,
        embeds: [embedMerchant(details)],
      });
  } catch (error) {
    console.log(error);
  }
};

/**
 * Function to embed merchant messages in discord message
 * @param {Object} details
 * @returns {MessageEmbed}
 */
const embedMerchant = (details) => {
  return new MessageEmbed()
    .setTitle(details.item)
    .setImage(details.image)
    .setDescription(`${details.location}\n ${details.spawned}`)
    .addField('More Details', details.orig, true);
};

/*
  Lost Ark Merchant Alerts V2
*/

/**
 * Card Pinger Function V2
 * @param {Array} data
 * @param {Array} pingFlag
 * @param {Client} client
 */
const merchantAlertsV2 = async (data, channel, spawnTime) => {
  data
    .filter((merchant) => merchant.activeMerchants[merchant.activeMerchants.length - 1].votes > 7)
    .map(async (merchant) => {
      // grabs merchant json
      const merchants = await fetch('https://lostmerchants.com/data/merchants.json');
      const body = await merchants.json();

      // assign latest active merchant
      const activeMerchant = merchant.activeMerchants[merchant.activeMerchants.length - 1];
      // check cards
      let roles = itemList
        .filter((item) => activeMerchant.card.name.includes(item.itemName))
        .map(({ role }) => role);

      // check rapport
      if (activeMerchant.rapport.rarity === 4) {
        roles = process.env.RAPPORT_ROLE + roles;
      } else roles = roles.toString();

      // start pinging process
      if (
        roles.toString() !== '' &&
        (await merchantFlag.get(merchant.merchantName)) === undefined
      ) {
        // build embed
        const embed = new MessageEmbed()
          .setTitle(`${activeMerchant.name} [${body[activeMerchant.name].Region}]`)
          .setDescription(
            `**Location**: ${activeMerchant.zone} \n` +
              `**Spawned**: <t:${Math.floor(spawnTime / 1000)}:R> \n\n` +
              `**Card**: ${activeMerchant.card.name} \n` +
              `**Rapport**: ${activeMerchant.rapport.rarity === 4 ? 'Leggo' : 'Epic'}`
          )
          .setImage(`${IMAGE_URL}${encodeURIComponent(activeMerchant.zone)}.jpg`);

        // ping people
        try {
          if (!roles) throw `WARN: Role is undefined`;
          else
            await channel.send({
              content: roles,
              embeds: [embed],
            });
        } catch (error) {
          console.log(error);
        }
        // mark merchant as pinged for the cycle
        await merchantFlag.set(activeMerchant.name, 1, 30 * 60 * 1000);
      }
    });
};

/**
 * Function to build full merchants listing
 * @param {Array} data
 * @param {Date} spawnTime
 * @returns {MessageEmbed}
 */
const buildMerchantEmbed = async (data, spawnTime) => {
  if (data.length === 0)
    return new MessageEmbed()
      .setTitle('Wandering Merchant')
      .setDescription(
        `Spawned <t:${Math.floor(
          spawnTime / 1000
        )}:R> \n Awaiting votes or merchant not spawning yet`
      );
  else
    return new MessageEmbed()
      .setTitle('Wandering Merchant')
      .setDescription(`Spawned <t:${Math.floor(spawnTime / 1000)}:R>`)
      .addFields(await buildMerchantFields(data));
};

/**
 * Function to return list of merchants available in an Array
 * @param {JSON} data
 * @returns {Array}
 */
const buildMerchantFields = async (data) => {
  // grabs merchant json
  const merchants = await fetch('https://lostmerchants.com/data/merchants.json');
  const body = await merchants.json();

  // transform source and return fields array
  return data.map((merchant) => {
    const activeMerchant = merchant.activeMerchants[merchant.activeMerchants.length - 1];
    return {
      name: `${activeMerchant.name} [${body[activeMerchant.name].Region}]`,
      value:
        `Location: [${activeMerchant.zone}](${IMAGE_URL}${encodeURIComponent(
          activeMerchant.zone
        )}.jpg) \n` +
        `Card: ${activeMerchant.card.name} \n` +
        `Rapport: ${activeMerchant.rapport.rarity === 4 ? '**Leggo**' : 'Epic'} \n` +
        `Votes: ${activeMerchant.votes}`,
      inline: true,
    };
  });
};

module.exports = {
  serverStatus,
  merchantAlerts,
  buildMerchantEmbed,
  merchantAlertsV2,
};
