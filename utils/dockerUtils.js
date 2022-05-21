const Docker = require('dockerode');
require('dotenv').config();

const docker = new Docker({
  host: process.env.DOCKER_HOST,
  protocol: 'https',
  port: 443,
  headers: {
    'CF-Access-Client-Secret': process.env.CF_SECRET,
    'CF-Access-Client-Id': process.env.CF_CLIENT_ID,
  },
});
const container = docker.getContainer(process.env.FACTORYCONTAINER);

const calculateCPUPercent = (stats) => {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuPercent = ((cpuDelta / systemDelta) * 100).toFixed(2);

  return cpuPercent;
};

const getArchive = (options) => {
  return container.getArchive(options);
};

const startContainer = () => {
  return container.start();
};

module.exports = {
  calculateCPUPercent,
  getArchive,
  startContainer,
  docker,
};
