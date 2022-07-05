/* eslint-disable no-unused-vars */
const { MessageEmbed, TextChannel } = require('discord.js');
const fetch = require('node-fetch');
const parser = require('node-html-parser');
const { itemList, NAME_CLASS, STATUS_CLASSES, IMAGE_URL, MONITOR_PERIOD } = require('./constants');
const { merchantFlag, merchantData, spawnCheck } = require('./helpers');
const merchantsInfo = require('../data/merchants.json');
const all = require('it-all');

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
 * Function to init merchants spawning in the cycle
 * @param {Date} spawnTime
 * @returns {Promise<MessageEmbed>}
 */
const initMerchants = async (spawnTime, activeMerchants) => {
  // Parse and init merchants that are spawning
  await Promise.all(
    Object.values(merchantsInfo)
      .filter((merchant) =>
        merchant.AppearanceTimes.some((timeStr) => spawnCheck(spawnTime, timeStr))
      )
      .map(async (merchant_1) => {
        await merchantData.set(merchant_1.Name, {
          merchantName: merchant_1.Name,
          Region: merchant_1.Region,
          activeMerchants: [],
        });
      })
  );
  // Populate merchants with data if exists
  if (activeMerchants.length > 0) {
    await populateMerchants(activeMerchants, MONITOR_PERIOD);
  }
  return await buildMerchantEmbed(spawnTime);
};

/**
 * Function to build full merchant listing
 * @param {number} spawnTime
 * @returns {Promise<MessageEmbed>}
 */
const buildMerchantEmbed = async (spawnTime) => {
  return new MessageEmbed()
    .setTitle('Wandering Merchant')
    .setDescription(`Spawned <t:${Math.floor(spawnTime / 1000)}:R>`)
    .addFields(await buildMerchantFields());
};

/**
 * Helper Function to build embed fields array
 * @returns {Promise<Array>}
 */
const buildMerchantFields = () => {
  return all(merchantData.iterator()).then((merchants) =>
    merchants.map((merchant) => {
      const activeMerchant = merchant[1].activeMerchants.slice(-1)[0];
      return {
        name: `${merchant[1].merchantName} [${merchant[1].Region}]`,
        value:
          `Location: ${
            activeMerchant
              ? `[${activeMerchant.zone}](${
                  IMAGE_URL + encodeURIComponent(activeMerchant.zone) + '.jpg'
                })`
              : '?'
          } \n` +
          `Card: ${activeMerchant ? activeMerchant.card.name : '?'} \n` +
          `Rapport: ${
            activeMerchant ? (activeMerchant.rapport.rarity === 4 ? '**Leggo**' : 'Epic') : '?'
          } \n` +
          `Votes: ${activeMerchant ? activeMerchant.votes : '?'}`,
        inline: true,
      };
    })
  );
};

/**
 * Card Pinger Function V3
 * @param {Array} data
 * @param {TextChannel} channel
 * @param {number} spawnTime
 */
const merchantAlerts = async (merchant, channel, spawnTime) => {
  // start ETL and ping process
  // assign latest active merchant
  const activeMerchant = merchant.activeMerchants.slice(-1)[0];
  // check cards
  let roles = itemList
    .filter((item) => activeMerchant.card.name.includes(item.itemName))
    .map(({ role }) => role);

  // check rapport
  if (activeMerchant.rapport.rarity === 4) {
    roles = process.env.RAPPORT_ROLE + roles;
  } else roles = roles.toString();

  // start pinging process
  if (roles !== '') {
    // build embed
    const embed = new MessageEmbed()
      .setTitle(`${activeMerchant.name} [${merchantsInfo[activeMerchant.name].Region}]`)
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
    await merchantFlag.set(activeMerchant.name, 1, spawnTime + MONITOR_PERIOD - Date.now());
  }
};

/**
 * Populate db with known merchants
 * @param {Object} activeMerchants
 * @param {number} ttl
 */
const populateMerchants = async (activeMerchants, ttl) => {
  await Promise.all(
    activeMerchants.map(async (activeMerchant) => {
      const curr = await merchantData.get(activeMerchant.merchantName);
      await merchantData.set(activeMerchant.merchantName, { ...curr, ...activeMerchant }, ttl);
    })
  );
};

module.exports = {
  initMerchants,
  serverStatus,
  buildMerchantEmbed,
  merchantAlerts,
  buildMerchantFields,
  populateMerchants,
};
