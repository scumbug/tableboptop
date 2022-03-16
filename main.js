// Include dependencies
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const lib = require('lib')({ token: process.env.STDLIB_SECRET_TOKEN });
const cron = require('node-cron');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

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
  console.log(
    await lib.utils.kv['@0.1.16'].tables.truncate({ table: 'scumbug' })
  );

  cron.schedule('*/10 * * * * *', async () => {
    console.log('running');
    let data = await lib.crawler.query['@0.0.2'].selectors({
      url: `https://docs.google.com/spreadsheets/d/e/2PACX-1vSxDVCVha3TNmddh1k8ZXaswXnT5BVKhCflPuJ7x_HRCaqRbfmq8qHQ8h3z8KerqJ_ozu1vcU2DTpE7/pubhtml?gid=1483084052&single=true`,
      userAgent: `stdlib/crawler/query`,
      includeMetadata: false,
      selectorQueries: [
        {
          selector: `.ritz`,
          resolver: `text`,
        },
      ],
    });
    let votes = data.queryResults[0][0].text.substring(1).split('VOTE');
    const channel = client.channels.cache.get(process.env.MERCHANT_CHANNEL_ID);

    for (vote in votes) {
      if (votes[vote].includes(`${process.env.LA_SERVER}wei`)) {
        //Check if we've already sent a mention for this specific vote
        let checkForDuplicate = await lib.utils.kv['@0.1.16'].get({
          key: `${votes[vote]}`,
          defaultValue: 'False',
        });
        if (checkForDuplicate == 'True') {
          console.log('Duplicate Skipped');
        } else {
          //message being sent
          channel.send(`${process.env.WEI_ROLE}`);
          //Prevent vote from being sent out for 1 week
          let sentMention = await lib.utils.kv['@0.1.16'].set({
            key: `${votes[vote]}`,
            value: 'True',
            ttl: 172800,
          });
        }
      }
    }
    console.log(await lib.utils.kv['@0.1.16'].entries());
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

// Login to Discord with your client's token
client.login(process.env.TOKEN);
