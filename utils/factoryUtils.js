const fetch = require('node-fetch');

const postFactoryAPI = async (method, data) => {
  const endpoint = 'https://factmon.imcs.fyi/api/v1';
  const payload = {
    function: method,
    data: data,
  };

  const response = await fetch(endpoint, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer ewoJInBsIjogIkFQSVRva2VuIgp9.F7E3BA3AF95626629ABA89D8670B06411645FF465FF5045152D47868C5F8CD80A98C2F41457ECE9FF31C6086FD8C44D81537B504295D9C93443A48E25BFBDB30',
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
