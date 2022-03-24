// Include dependencies
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const http = require('http');
require('dotenv').config();

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
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
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
