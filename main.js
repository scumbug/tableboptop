// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed } = require('discord.js');
const Docker = require('dockerode');
const { calculateCPUPercent } = require('./utils');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const Stream = require('stream');
require('dotenv').config();

const B_TO_GB = 1073741824;

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', async () => {
	console.log('Ready!');
	const container = docker.getContainer(process.env.FACTORYCONTAINER);

	const logStream = new Stream.PassThrough();

	logStream.on('data', function (chunk) {
		console.log(chunk.toString('utf8'));
	});

	const stream = await container.logs(
		{ follow: true, stdout: true, tail: 10 },
		(err, stream) => {
			container.modem.demuxStream(stream, logStream, logStream);
			stream.on('end', () => {
				logStream.end('!stop!');
			});
			setTimeout(() => {
				stream.destroy();
			}, 2000);
		}
	);
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;
	const container = docker.getContainer(process.env.FACTORYCONTAINER);

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
		container.restart(async (err, res) => {
			if (res === null) {
				await interaction.reply(err.reason);
			}
		});
		await interaction.reply('Restarting server');
	}
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
