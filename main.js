// Include dependencies
const { channel } = require('diagnostics_channel');
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');
require('dotenv').config();
const fetch = require('node-fetch');
const parser = require('node-html-parser');
const schedule = require('node-schedule');

// Allow health checks on fly.io to ping bot
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Pong!');
    res.end();
  })
  .listen(8080);

// Create a new client instance
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_PRESENCES,
  ],
});

// import commands JS
client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// When the client is ready, run this code (only once)
client.once('ready', async () => {
  console.log('Ready!');

  client.user.setActivity('Initializing...');

  // Update server status
  schedule.scheduleJob('*/1 * * * *', async () => {
    const status = await serverStatus(process.env.LA_SERVER);
    const old = client.user.presence.activities[0].name;

    // check if out of maint
    if (old.includes('Maint') && status != 'Maint')
      // TODO
      console.log('ping');

    // set new status
    client.user.setActivity(`Lost Ark | Valtan: ${status}`);
  });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

client.on('messageCreate', async (message) => {
  // Wei Card Ping
  merchantAlerts(message);
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);

// Wei Card Pinger Function
const merchantAlerts = async (message) => {
  const channel = await client.channels.cache.get(process.env.MCT_CHN);

  if (!!message.embeds.length) {
    const s = message.embeds[0].description;
    const start = '**Item**: ```';
    const end = '```\n';
    const item = s.slice(s.indexOf(start) + start.length + 3, s.indexOf(end));
    const trust = s.includes('Up-and-coming contributor')
      ? 'Medium'
      : s.includes('Trusted Voter')
      ? 'High'
      : 'Low, check at your risk!';

    // log pings
    console.log(item.trim() + ' popped');

    // ping role function
    const pingRoles = async (role) => {
      console.log(`Alerting peeps with ${item.trim()} role`);
      return await channel.send(
        `${role} **${item}** popped, trust level: **${trust}**`
      );
    };

    // ping role for items
    if (item.includes('Wei')) pingRoles(process.env.WEI_ROLE);
    else if (item.includes('Seria')) pingRoles(process.env.SERIA_ROLE);
    else if (item.includes('Rapport')) pingRoles(process.env.RAPPORT_ROLE);
    else if (item.includes('Madnick')) pingRoles(process.env.MADNICK_ROLE);
    else if (item.includes('Sian')) pingRoles(process.env.SIAN_ROLE);
  }
};

const testPing = async (message) => {
  const channel = client.channels.cache.get('');

  const merchn = client.channels.cache.get('');

  const msgs = await merchn.messages.fetch({ limit: 100 });

  msgs.forEach((message) => {
    if (message.embeds[0].description.includes('css'))
      console.log(message.embeds[0].description);
  });
};

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
