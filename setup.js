const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();
const { dirs } = require('./utils/helpers');

const commands = [];
const commandFiles = dirs('./commands');

for (const file of commandFiles) {
  if (file.endsWith('.js')) {
    const command = require(`./${file}`);
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

rest
  .put(Routes.applicationCommands(process.env.CLIENTID), { body: commands })
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error);
