const fs = require('fs');
const path = require('path');
const Keyv = require('keyv');

const dirs = (p, a = []) => {
  if (fs.statSync(p).isDirectory())
    fs.readdirSync(p).map((f) => dirs(a[a.push(path.join(p, f)) - 1], a));
  return a;
};

const merchantFlag = new Keyv(process.env.REDIS, { namespace: 'merchantFlag' });

module.exports = {
  dirs,
  merchantFlag,
};
