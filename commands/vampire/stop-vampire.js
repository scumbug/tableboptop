const { SlashCommandBuilder } = require('@discordjs/builders');
const { docker } = require('../../utils/dockerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('stop-vampire').setDescription('Stop VRising Server'),
  async execute(interaction) {
    const container = docker.getContainer(process.env.VAMPIRECONTAINER);
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
