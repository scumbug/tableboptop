// Include dependencies
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const {
  ETwitterStreamEvent,
  TweetStream,
  TwitterApi,
  ETwitterApiError,
} = require('twitter-api-v2');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const twt = new TwitterApi(process.env.TWT_BEARER);
let mention = 'Empty';

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

  const addedRules = await twt.v2.updateStreamRules({
    add: [{ value: 'from:SaintBotLoA' }],
  });
  const stream = await twt.v2.searchStream();

  stream.on(
    // Emitted when a Twitter payload (a tweet or not, given the endpoint).
    ETwitterStreamEvent.Data,
    (eventData) => {
      console.log('Twitter has sent something:', eventData.data.text);
      const channel = client.channels.cache.get(
        process.env.MERCHANT_CHANNEL_ID
      );

      try {
        if (eventData.data.text.includes(`${process.env.LA_SERVER}wei`)) {
          //Mention Role ID For WEI
          channel.send(`${process.env.WEI_ROLE}`);
        }
      } catch (err) {
        console.log(err);
      }
    }
  );

  stream.on(
    // Emitted when Node.js {response} emits a 'error' event (contains its payload).
    ETwitterStreamEvent.ConnectionError,
    (err) => console.log('Connection error!', err)
  );

  stream.on(
    // Emitted when Node.js {response} is closed by remote or using .close().
    ETwitterStreamEvent.ConnectionClosed,
    () => console.log('Connection has been closed.')
  );

  stream.on(
    // Emitted when a Twitter sent a signal to maintain connection active
    ETwitterStreamEvent.DataKeepAlive,
    () => console.log('Twitter has a keep-alive packet.')
  );

  // Enable reconnect feature
  stream.autoReconnect = true;
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

// Login to Discord with your client's token
client.login(process.env.TOKEN);
