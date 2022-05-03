// Include dependencies
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');
require('dotenv').config();
const schedule = require('node-schedule');
const { serverStatus, merchantAlerts } = require('./utils/lostarkUtils');

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
    client.user.setActivity(`Lost Ark | ${process.env.LA_SERVER}: ${status}`);
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
  merchantAlerts(message, client);
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);

// Debugging func
/*
const testPing = async () => {
  const channel = client.channels.cache.get('900970469614833674');

  const merchn = client.channels.cache.get('');

  const msgs = await merchn.messages.fetch({ limit: 100 });

  channel.send({
    content: 'roleping',
    embeds: [
      embedMerchant(
        '**[test]**',
        'https://i.imgur.com/P6s2yVy.png',
        'Location: [Anikka] [Prisma Valley]',
        'Spawned: 13 hours ago',
        'https://discord.com/channels/226688777026928641/952552366031376414/970754519732478013'
      ),
    ],
  });

  msgs.forEach((message) => {
    if (message.embeds[0]) {
      const s = message.embeds[0].description.split('\n');
      const item = s[
        s.findIndex((line) => line.includes('**Item**')) + 1
      ].slice(0, -3);
      const location = s.find((line) => line.includes('**Location**'));
      const spawned = s.find((line) => line.includes('**Spawned**'));

      channel.send(
        `roleping\n**${item}** popped. \n${location}\n ${spawned}\n\nMore Details: ${message.url}`
      );
    }
  });
};
*/
