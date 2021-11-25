const { SlashCommandBuilder } = require('@discordjs/builders');
const { stopContainer } = require('../utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop-factory')
		.setDescription(
			'Stop Satisfactory Server, make sure you leave game first!'
		),
	async execute(interaction) {
		await interaction.deferReply('Restarting server, please hodl...');
		try {
			await stopContainer();
			await interaction.editReply('Server has been shutdown');
		} catch (error) {
			await interaction.editReply(`Sumting wong: ${error.reason}`);
			return null;
		}
	},
};
