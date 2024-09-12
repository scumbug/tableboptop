const fetch = require('node-fetch');

const postFactoryAPI = async (method, data) => {
  const endpoint = process.env.FACTORY_API;
  const payload = {
    function: method,
    data: data,
  };

  const response = await fetch(endpoint, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.FACTORY_SECRET,
    },
  });

  if(response.headers.get('content-type').includes("application/json")) return (await response.json()).data
  else return (await response.buffer())
};

const getLatestSave = async () => {
  const getSessions = await postFactoryAPI('EnumerateSessions');
  const currSession = getSessions.sessions[getSessions.currentSessionIndex];
  const latestSaveName = currSession.saveHeaders.reduce((max, current) => {
    return current.playDurationSeconds > max.playDurationSeconds ? current : max;
  }, currSession.saveHeaders[0].saveName);

  return await postFactoryAPI('DownloadSaveGame', { SaveName: latestSaveName });
};

getLatestSave()

// Examples:
//postFactoryAPI('QueryServerState').then(res => console.log(res))
// postFactoryAPI('EnumerateSessions').then((res) => console.log(res));
// postFactoryAPI('HealthCheck',{clientCustomData: ""}).then((res) => console.log(res));

module.exports = {
  postFactoryAPI,
  getLatestSave,
};
