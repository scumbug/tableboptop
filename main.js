// Include dependencies
const {
	Client,
	Intents,
	MessageEmbed,
	MessageAttachment,
} = require('discord.js');
const Docker = require('dockerode');
const { calculateCPUPercent } = require('./utils');
const fs = require('fs');
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
client.once('ready', async () => {
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
		await interaction.deferReply('Restarting server, please hodl...');
		try {
			await container.restart();
		} catch (error) {
			await interaction.editReply(`Sumting wong: ${error.reason}`);
			return null;
		}
		const stream = await container.logs({
			follow: true,
			stdout: true,
			tail: 10,
		});
		stream.on('data', async (chunk) => {
			if (chunk.toString('utf8').includes(SERVER_UP_NOTIFICATION))
				await interaction.editReply('Server restarted successfully');
		});
	} else if (commandName === 'grab-save') {
		// grab latest save file from server
		await interaction.deferReply('Retrieving save file...');
		const save = await container.getArchive({ path: process.env.SAVEDIR });
		const file = fs.createWriteStream('latest-save.tar');
		save.pipe(file);
		save.on('end', async () => {
			console.log('done');
			const attachSave = new MessageAttachment('latest-save.tar');
			await interaction.editReply({ files: [attachSave] });
			fs.unlink('latest-save.tar', (err) => {
				if (err) throw err;
			});
		});
	}
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
