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
    const start = '```fix\n';
    const end = '```\n';
    const item = s.slice(s.indexOf(start) + start.length - 1, s.indexOf(end));
    console.log(item + ' popped');

    // ping role for wei card
    if (item.includes('No Good Items')) {
      console.log('Wei popped, alerting peeps');

      if (s.includes('Up-and-coming contributor'))
        channel.send(
          `${process.env.WEI_ROLE} Wei card popped, trust level: medium`
        );
      else if (s.includes('Trusted Voter'))
        channel.send(
          `${process.env.WEI_ROLE} Wei card popped, trust level: high`
        );
      else
        channel.send(
          `${process.env.WEI_ROLE} Unconfirmed Wei popped, check at your risk!`
        );
    }
  }
};
