const fs = require('fs');
const path = require('path');

const dirs = (p, a = []) => {
  if (fs.statSync(p).isDirectory())
    fs.readdirSync(p).map((f) => dirs(a[a.push(path.join(p, f)) - 1], a));
  return a;
};

module.exports = {
  dirs,
};
