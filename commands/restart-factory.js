const { SlashCommandBuilder } = require('@discordjs/builders');
const { restartContainer, getLogs } = require('../utils');

const SERVER_UP_NOTIFICATION =
	'seconds to LoadMap(/Game/FactoryGame/Map/GameLevel01/Persistent_Level)';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('restart-factory')
		.setDescription(
			'Restart Satisfactory Server, make sure you leave game first!'
		),
	async execute(interaction) {
		await interaction.deferReply('Restarting server, please hodl...');
		try {
			await restartContainer();
		} catch (error) {
			await interaction.editReply(`Sumting wong: ${error.reason}`);
			return null;
		}
		const stream = await getLogs({
			follow: true,
			stdout: true,
			tail: 10,
		});
		stream.on('data', async (chunk) => {
			if (chunk.toString('utf8').includes(SERVER_UP_NOTIFICATION))
				await interaction.editReply('Server restarted successfully');
		});
	},
};
