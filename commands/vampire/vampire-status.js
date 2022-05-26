const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { docker, calculateCPUPercent } = require('../../utils/dockerUtils');

// initalise constants
const B_TO_GB = 1073741824;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vampire-status')
    .setDescription('Replies with server info!'),
  async execute(interaction) {
    const container = docker.getContainer(process.env.VAMPIRECONTAINER);
    const stats = await container.stats({ stream: false });
    const state = await container.inspect();

    const memUsage = ((stats.memory_stats.usage - stats.memory_stats.stats.total_inactive_file) / B_TO_GB).toFixed(2);

    const statsEmbed = new MessageEmbed()
      .setTitle('VRising Server Stats')
      .addFields(
        { name: 'Service Status', value: `${state.State.Status}` },
        { name: 'Started At', value: `${state.State.StartedAt}` },
        { name: 'Ram Usage', value: `${memUsage} GB` },
        { name: 'CPU Usage', value: `${calculateCPUPercent(stats)} %` }
      );
    await interaction.reply({ embeds: [statsEmbed] });
  },
};
