const fs = require('fs');
const path = require('path');
const Keyv = require('keyv');
const { parse } = require('date-fns');
const { MONITOR_PERIOD } = require('./constants');
const all = require('it-all');

require('dotenv').config();

const dirs = (p, a = []) => {
  if (fs.statSync(p).isDirectory())
    fs.readdirSync(p).map((f) => dirs(a[a.push(path.join(p, f)) - 1], a));
  return a;
};

const spawnCheck = (t1, tStr) => {
  const t2 = parse(tStr + ' -07', 'HH:mm:ss x', new Date());
  return t2.getHours() == t1.getHours() && t2.getMinutes() == t1.getMinutes();
};

const isSpawnCycle = (time) => {
  return time.getMinutes() > 30 && time.getMinutes() < 55;
};

// Redis Datastore
const merchantData = new Keyv(process.env.REDIS, {
  namespace: 'merchantData',
  ttl: MONITOR_PERIOD,
});
const merchantFlag = new Keyv(process.env.REDIS, { namespace: 'merchantFlag' });
const merchantConf = new Keyv(process.env.REDIS, {
  namespace: 'merchantConf',
  ttl: MONITOR_PERIOD,
});

const getMerchantConfs = async () => {
  return (await all(merchantConf.iterator())).reduce((a, [b, c]) => ((a[b] = c), a), {});
};

module.exports = {
  dirs,
  merchantFlag,
  merchantData,
  spawnCheck,
  isSpawnCycle,
  merchantConf,
  getMerchantConfs,
};
