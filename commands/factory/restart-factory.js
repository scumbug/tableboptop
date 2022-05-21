const { SlashCommandBuilder } = require('@discordjs/builders');
const { docker } = require('../../utils/dockerUtils');

const SERVER_UP_NOTIFICATION =
  'seconds to LoadMap(/Game/FactoryGame/Map/GameLevel01/Persistent_Level)';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restart-factory')
    .setDescription('Restart Satisfactory Server, make sure you leave game first!'),
  async execute(interaction) {
    const container = docker.getContainer(process.env.FACTORYCONTAINER);
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
  },
};
