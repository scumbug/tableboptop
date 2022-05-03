const { SlashCommandBuilder } = require('@discordjs/builders');
const { getArchive } = require('../utils/dockerUtils');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grab-save')
    .setDescription('Get latest save files from server'),
  async execute(interaction) {
    // grab latest save file from server
    await interaction.deferReply('Retrieving save file...');
    const save = await getArchive({ path: process.env.SAVEDIR });
    const file = fs.createWriteStream('latest-save.tar');
    save.pipe(file);
    save.on('end', async () => {
      console.log('done');
      const server = await (
        await fetch('https://api.gofile.io/getServer', {
          method: 'GET',
        })
      ).json();

      const uploadFile = new FormData();
      uploadFile.append('file', fs.createReadStream('latest-save.tar'));

      const upload = await (
        await fetch(`https://${server.data.server}.gofile.io/uploadFile`, {
          method: 'POST',
          body: uploadFile,
        })
      ).json();

      await interaction.editReply(
        `Download save file @ ${upload.data.downloadPage}`
      );

      // delete tmp file
      fs.unlink('latest-save.tar', (err) => {
        if (err) throw err;
      });
    });
  },
};
