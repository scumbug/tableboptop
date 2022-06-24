// Include dependencies
const { Client, Intents, Collection } = require('discord.js');
const { dirs } = require('./utils/helpers');
const http = require('http');
const { merchantAlerts } = require('./utils/lostarkUtils');
const { runScheduler } = require('./utils/scheduler');

require('dotenv').config();

// Create a new client instance
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES],
});

// import commands JS
client.commands = new Collection();

const commandFiles = dirs('./commands');

for (const file of commandFiles) {
  if (file.endsWith('.js')) {
    const command = require(`./${file}`);
    client.commands.set(command.data.name, command);
  }
}

// When the client is ready, run this code (only once)
client.once('ready', async () => {
  console.log('Ready!');
  client.user.setActivity('Initializing...');

  // Start crons
  runScheduler(client);
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

// client.on('messageCreate', async (message) => {
//   // filter Saint Bot announcements
//   if (message.embeds.length && message.channelId === process.env.MCT_CHN) {
//     // Card pinger
//     merchantAlerts(message, client);
//   }
// });

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
