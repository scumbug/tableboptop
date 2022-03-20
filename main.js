// Include dependencies
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

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
  const channel = client.channels.cache.get(process.env.MCT_CHN);

  if (message.channelId == process.env.MCT_CHN && !!message.embeds.length) {
    // log pings
    const s = message.embeds[0].description;
    const start = '**Item**: ```';
    const end = '```\n';
    const item = s.slice(s.indexOf(start) + start.length + 3, s.indexOf(end));
    const trust = s.includes('Up-and-coming contributor')
      ? 'Medium'
      : s.includes('Trusted Voter')
      ? 'High'
      : 'Low, check at your risk!';
    console.log(item.trim() + ' popped');

    // ping role for wei card
    if (item.includes('Wei')) {
      pingRoles(process.env.WEI_ROLE, item, trust, channel);
    } else if (item.includes('Seria')) {
      pingRoles(process.env.SERIA_ROLE, item, trust, channel);
    } else if (item.includes('Legendary Rapport')) {
      pingRoles(process.env.RAPPORT_ROLE, item, trust, channel);
    } else if (item.includes('Madnick')) {
      pingRoles(process.env.MADNICK_ROLE, item, trust, channel);
    } else if (item.includes('Sian')) {
      pingRoles(process.env.SIAN_ROLE, item, trust, channel);
    }
  }
};

const pingRoles = async (role, item, trust, channel) => {
  console.log(`${item} popped, alerting peeps`);
  return await channel.send(
    `${role} **${item}** popped, trust level: **${trust}**`
  );
};

const testPing = async (message) => {
  const channel = client.channels.cache.get('');

  const merchn = client.channels.cache.get('');

  const msgs = await merchn.messages.fetch({ limit: 30 });

  msgs.forEach(async (message) => await merchantAlerts(message));

  pingRoles(
    '<@&953626513415209030>',
    'testing',
    'Low, check at your risk',
    channel
  );
};
