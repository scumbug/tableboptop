const { SlashCommandBuilder } = require('@discordjs/builders');
const { docker } = require('../../utils/dockerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop-factory')
    .setDescription('Stop Satisfactory Server, make sure you leave game first!'),
  async execute(interaction) {
    const container = docker.getContainer(process.env.FACTORYCONTAINER);
    await interaction.deferReply('Restarting server, please hodl...');
    try {
      await container.stop();
      await interaction.editReply('Server has been shutdown');
    } catch (error) {
      await interaction.editReply(`Sumting wong: ${error.reason}`);
      return null;
    }
  },
};
