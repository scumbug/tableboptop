/* eslint-disable no-unused-vars */
const { MessageEmbed, TextChannel } = require('discord.js');
const fetch = require('node-fetch');
const parser = require('node-html-parser');
const blizzard = require('blizzard.js')
require('dotenv').config()

//Frostmourne ID is 3725
//const serverID = 3725

/* Returns WoW Server Status */
const wowrealmStatus = async(serverID) =>{
  const wowClient = await blizzard.wow.createInstance({
    key: process.env.BLIZZCLIENTID,
    secret: process.env.BLIZZCLIENTSECRET,
  })

  return wowClient.connectedRealm({id: serverID})
}


module.exports = {
  wowrealmStatus
};