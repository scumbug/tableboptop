const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

require('dotenv').config();

const commands = [
	new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with pong!'),
	new SlashCommandBuilder()
		.setName('factory-status')
		.setDescription('Replies with server info!'),
	new SlashCommandBuilder()
		.setName('restart-factory')
		.setDescription(
			'Restart Satisfactory Server, make sure you leave game first!'
		),
].map((command) => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

rest
	.put(Routes.applicationCommands(process.env.CLIENTID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
