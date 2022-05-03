const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { getState, getStats } = require('../utils/dockerUtils');
const { calculateCPUPercent } = require('../utils/dockerUtils');

// initalise constants
const B_TO_GB = 1073741824;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('factory-status')
    .setDescription('Replies with server info!'),
  async execute(interaction) {
    const stats = await getStats();
    const state = await getState();

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
  },
};
