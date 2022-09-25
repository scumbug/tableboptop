const blizzard = require('blizzard.js');
require('dotenv').config();

/**
 * Returns WoW Server Status
 * @param {number} serverID
 */
const wowRealmStatus = async (serverID) => {
  const wowClient = await blizzard.wow.createInstance({
    key: process.env.BLIZZ_CLIENT_ID,
    secret: process.env.BLIZZ_CLIENT_SECRET,
  });

  return wowClient.connectedRealm({ id: serverID });
};

module.exports = {
  wowRealmStatus,
};
