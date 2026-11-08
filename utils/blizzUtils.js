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

/**
 * Returns WoW Forever PvE ruleset status for Americas & Oceania.
 * Forever uses rulesets instead of connected realms; PvE (Normal) is ruleset 2.
 */
const wowForeverStatus = async () => {
  const wowClient = await blizzard.wow.createInstance({
    key: process.env.BLIZZ_CLIENT_ID,
    secret: process.env.BLIZZ_CLIENT_SECRET,
    origin: 'us',
    locale: 'en_US',
  });

  // The installed SDK predates Forever, so register its resource explicitly.
  const rulesetStatus = wowClient.createClientResourceRequest(() => ({
    path: 'data/wow/ruleset/2',
    namespace: 'dynamic-forever',
  }));

  return rulesetStatus();
};

module.exports = {
  wowRealmStatus,
  wowForeverStatus,
};
