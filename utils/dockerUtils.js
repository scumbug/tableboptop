const Docker = require('dockerode');
require('dotenv').config();

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const container = docker.getContainer(process.env.FACTORYCONTAINER);

const calculateCPUPercent = (stats) => {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuPercent = ((cpuDelta / systemDelta) * 100).toFixed(2);

  return cpuPercent;
};

const getStats = () => {
  return container.stats({ stream: false });
};

const getState = () => {
  return container.inspect();
};

const restartContainer = () => {
  return container.restart();
};

const getLogs = (options) => {
  return container.logs(options);
};

const getArchive = (options) => {
  return container.getArchive(options);
};

const stopContainer = () => {
  return container.stop();
};

const startContainer = () => {
  return container.start();
};

module.exports = {
  calculateCPUPercent,
  getState,
  getStats,
  restartContainer,
  getLogs,
  getArchive,
  stopContainer,
  startContainer,
};
