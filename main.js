// Include dependencies
const {
	Client,
	Intents,
	MessageEmbed,
	MessageAttachment,
	Collection
} = require('discord.js');
const Docker = require('dockerode');
const { calculateCPUPercent } = require('./utils');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();

// initalise constants
const B_TO_GB = 1073741824;
const SERVER_UP_NOTIFICATION = 'LogGame: World Serialization (load)';

// Init docker
const docker = new Docker({ socketPath: 'cs-nas:2375' });
const container = docker.getContainer(process.env.FACTORYCONTAINER);

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// import commands JS
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
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
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
