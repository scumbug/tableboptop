// Include dependencies
const { Client, Intents, MessageEmbed } = require('discord.js');
const Docker = require('dockerode');
const { calculateCPUPercent } = require('./utils');
require('dotenv').config();

// initalise constants
const B_TO_GB = 1073741824;
const SERVER_UP_NOTIFICATION = 'LogGame: World Serialization (load)';

// Init docker
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const container = docker.getContainer(process.env.FACTORYCONTAINER);

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'factory-status') {
		const stats = await container.stats({ stream: false });
		const state = await container.inspect();

		const memUsage = (stats.memory_stats.usage / B_TO_GB).toFixed(2);

		const statsEmbed = new MessageEmbed()
			.setTitle('Satisfactory Server Stats')
			.addFields(
				{ name: 'Service Status', value: `${state.State.Status}` },
				{ name: 'Started At', value: `${state.State.StartedAt}` },
				{ name: 'Ram Usage', value: `${memUsage} GB` },
				{ name: 'CPU Usage', value: `${calculateCPUPercent(stats)} %` }
			);
		await interaction.reply({ embeds: [statsEmbed] });
	} else if (commandName === 'restart-factory') {
		// do server checks
		await interaction.reply('Restarting server, please hodl...');
		const restartState = await container.restart();
		console.log(restartState);
		if (restartState === null) {
			await interaction.followUp(restartState.reason);
		} else {
			const stream = await container.logs({
				follow: true,
				stdout: true,
				tail: 10,
			});
			stream.on('data', async (chunk) => {
				if (chunk.toString('utf8').includes(SERVER_UP_NOTIFICATION))
					await interaction.followUp('Server restarted successfully');
			});
		}
	}
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
