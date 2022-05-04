// Include dependencies
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');
const schedule = require('node-schedule');
const { serverStatus, merchantAlerts } = require('./utils/lostarkUtils');

require('dotenv').config();

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

    const channel = client.channels.cache.get(process.env.LA_CHN);

    // Ping on status change
    if (old.includes('Maint') && status != 'Maint') {
      await channel.send('Server is up!');
    } else if (!old.includes('Maint') && status === 'Maint') {
      await channel.send('Lost Ark went into maintenance');
    }
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
  // filter Saint Bot announcements
  if (message.embeds.length && message.channelId == process.env.MCT_CHN) {
    // Card pinger
    merchantAlerts(message, client);
  }
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);

// Allow health checks on fly.io to ping bot
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Pong!');
    res.end();
  })
  .listen(8080);
