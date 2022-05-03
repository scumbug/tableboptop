const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const parser = require('node-html-parser');

/**
 * Returns lost ark server status
 * @param {string} name
 * @returns {string}
 */
const serverStatus = async (name) => {
  const MAINT_CLASS =
    '.ags-ServerStatus-content-responses-response-server-status--maintenance';
  const UP_CLASS =
    '.ags-ServerStatus-content-responses-response-server-status--good';
  const BUSY_CLASS =
    '.ags-ServerStatus-content-responses-response-server-status--busy';
  const FULL_CLASS =
    '.ags-ServerStatus-content-responses-response-server-status--full';
  const NAME_CLASS = '.ags-ServerStatus-content-responses-response-server-name';

  const rawHTML = await fetch(
    'https://www.playlostark.com/en-us/support/server-status'
  );

  const root = parser.parse(await rawHTML.text());

  for (let server of root.querySelectorAll(NAME_CLASS)) {
    if (server.text.trim() == name) {
      // maintenance
      if (server.parentNode.querySelector(MAINT_CLASS) != null) {
        return 'Maint';
      }
      // server full
      else if (server.parentNode.querySelector(FULL_CLASS) != null) {
        return 'Full';
      }
      // server busy
      else if (server.parentNode.querySelector(BUSY_CLASS) != null) {
        return 'Busy';
      }
      // server good
      else if (server.parentNode.querySelector(UP_CLASS) != null) {
        return 'Good';
      }
    }
  }

  // no match found server is down
  return 'Maint';
};

// Wei Card Pinger Function
/**
 *
 * @param {Message} message
 * @param {Client} client
 */
const merchantAlerts = async (message, client) => {
  if (message.embeds.length && message.channelId == process.env.MCT_CHN) {
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
    console.log(details.item + ' popped');

    // ping role function
    const pingRoles = async (role) => {
      const channel = client.channels.cache.get(process.env.ANN_CHN);
      console.log(`Alerting peeps with ${details.item} role`);
      return await channel.send({
        content: `${role}`,
        embeds: [embedMerchant(details)],
      });
    };

    // ping role for items
    if (details.item.includes('Rapport')) pingRoles(process.env.RAPPORT_ROLE);
    if (details.item.includes('Wei')) pingRoles(process.env.WEI_ROLE);
    else if (details.item.includes('Seria')) pingRoles(process.env.SERIA_ROLE);
    else if (details.item.includes('Madnick'))
      pingRoles(process.env.MADNICK_ROLE);
    else if (details.item.includes('Sian')) pingRoles(process.env.SIAN_ROLE);
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

const URL_REGEX =
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;

module.exports = {
  serverStatus,
  merchantAlerts,
};
