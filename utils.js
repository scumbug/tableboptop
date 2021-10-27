const calculateCPUPercent = (stats) => {
	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage -
		stats.precpu_stats.cpu_usage.total_usage;
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
	const cpuPercent = ((cpuDelta / systemDelta) * 100).toFixed(2);

	return cpuPercent;
};

module.exports = { calculateCPUPercent };
