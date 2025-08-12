const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');
//const { getLatestSave } = require('../../utils/factoryUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grab-save')
    .setDescription('Get latest save files from server'),
  async execute(interaction) {
    //await interaction.deferReply('Retrieving save file...');
    //const saveFile = new MessageAttachment(await getLatestSave(), `ocdbestcd_${Date.now()}.sav`)
    //await interaction.editReply({ files: [saveFile] });
    await interaction.deferReply('Service unavailable');
  },
};
