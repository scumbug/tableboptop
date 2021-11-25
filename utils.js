const Docker = require('dockerode');

const docker = new Docker({ host: '192.168.1.32', port: 2375 });
const container = docker.getContainer(process.env.FACTORYCONTAINER);

const calculateCPUPercent = (stats) => {
	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage -
		stats.precpu_stats.cpu_usage.total_usage;
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
	const cpuPercent = ((cpuDelta / systemDelta) * 100).toFixed(2);

	return cpuPercent;
};

const getStats = () => {
	return container.stats({ stream: false });
};

const getState = () => {
	return container.inspect();
};

module.exports = { calculateCPUPercent, getState, getStats };
