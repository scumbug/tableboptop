/* eslint-env mocha */
const assert = require('assert').strict;
const axios = require('axios');
const schedule = require('node-schedule');
const { wowForeverStatus } = require('../utils/blizzUtils');
const { runScheduler } = require('../utils/scheduler');

describe('WoW monitoring', () => {
  let originalAdapter;
  let originalScheduleJob;
  let originalWarn;
  let originalEnv;
  let jobs;
  let requests;
  let messages;
  let warnings;
  let presenceUpdates;
  let foreverResponse;
  let retailStatus;
  let failForever;
  let failRetail;
  let failSend;
  let waitForForever;
  let client;

  beforeEach(() => {
    originalAdapter = axios.defaults.adapter;
    originalScheduleJob = schedule.scheduleJob;
    originalWarn = console.warn;
    originalEnv = { ...process.env };
    Object.assign(process.env, {
      BLIZZ_CLIENT_ID: 'offline-client',
      BLIZZ_CLIENT_SECRET: 'offline-secret',
      BLIZZ_CHN: 'blizzard-channel',
      FROSTMOURNE: '3725',
    });
    jobs = [];
    requests = [];
    messages = [];
    warnings = [];
    presenceUpdates = 0;
    foreverResponse = { id: 2, name: 'Normal', status: { type: 'UP', name: 'Up' } };
    retailStatus = 'UP';
    failForever = false;
    failRetail = false;
    failSend = false;
    waitForForever = undefined;
    console.warn = (...args) => warnings.push(args);
    schedule.scheduleJob = (cron, tick) => jobs.push({ cron, tick });
    axios.defaults.adapter = async (config) => {
      requests.push(config);
      let data;
      if (config.url === 'https://us.battle.net/oauth/token') {
        data = { access_token: 'offline-token', expires_in: 3600 };
      } else if (config.url === 'https://us.api.blizzard.com/data/wow/ruleset/2') {
        if (failForever) throw new Error('Forever API unavailable');
        if (waitForForever) await waitForForever();
        data = foreverResponse;
      } else if (config.url === 'https://us.api.blizzard.com/data/wow/connected-realm/3725') {
        if (failRetail) throw new Error('Retail API unavailable');
        data = { status: { name: retailStatus }, realms: [{ name: 'Frostmourne' }] };
      } else {
        throw new Error(`Unexpected request: ${config.url}`);
      }
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    client = {
      user: { setActivity: async () => presenceUpdates++ },
      channels: {
        cache: {
          get: (id) => {
            assert.equal(id, 'blizzard-channel');
            return {
              send: async (message) => {
                if (failSend) throw new Error('Discord unavailable');
                messages.push(message);
              },
            };
          },
        },
      },
    };
    runScheduler(client);
  });

  afterEach(() => {
    axios.defaults.adapter = originalAdapter;
    schedule.scheduleJob = originalScheduleJob;
    console.warn = originalWarn;
    for (const key of ['BLIZZ_CLIENT_ID', 'BLIZZ_CLIENT_SECRET', 'BLIZZ_CHN', 'FROSTMOURNE']) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  const foreverTick = () => jobs[1].tick();
  const setForeverStatus = (type) => {
    foreverResponse = { ...foreverResponse, status: { type, name: type } };
  };

  it('uses OAuth and the US Forever PvE ruleset API with the Forever namespace', async () => {
    const response = await wowForeverStatus();
    assert.equal(response.data.id, 2);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, 'https://us.battle.net/oauth/token');
    assert.equal(requests[0].method, 'post');
    assert.deepEqual(requests[0].auth, { username: 'offline-client', password: 'offline-secret' });
    assert.equal(requests[1].url, 'https://us.api.blizzard.com/data/wow/ruleset/2');
    assert.equal(requests[1].headers['Battlenet-Namespace'], 'dynamic-forever-us');
    assert.equal(requests[1].headers.Authorization, 'Bearer offline-token');
    assert.equal(requests[1].params.locale, 'en_US');
  });

  it('schedules both monitors once per minute and silently establishes their baselines', async () => {
    assert.deepEqual(jobs.map((job) => job.cron), ['*/1 * * * *', '*/1 * * * *']);
    await jobs[0].tick();
    await foreverTick();
    assert.deepEqual(messages, []);
    assert.deepEqual(warnings, []);
    assert.equal(presenceUpdates, 1);
    const retailRequest = requests.find((request) => request.url.endsWith('/3725'));
    assert.equal(retailRequest.headers['Battlenet-Namespace'], 'dynamic-us');
  });

  it('does not notify for unchanged status or localized name changes', async () => {
    await foreverTick();
    foreverResponse.status.name = 'Online';
    await foreverTick();
    assert.deepEqual(messages, []);
    assert.deepEqual(warnings, []);
  });

  it('sends a single alert for each down and up transition', async () => {
    await foreverTick();
    setForeverStatus('DOWN');
    await foreverTick();
    await foreverTick();
    setForeverStatus('UP');
    await foreverTick();
    assert.deepEqual(messages, [
      'WoW Forever (Americas & Oceania, PvE) is DOWN',
      'WoW Forever (Americas & Oceania, PvE) is UP',
    ]);
  });

  it('silently initializes even when the ruleset is already down', async () => {
    setForeverStatus('DOWN');
    await foreverTick();
    setForeverStatus('UP');
    await foreverTick();
    assert.deepEqual(messages, ['WoW Forever (Americas & Oceania, PvE) is UP']);
  });

  it('retains the baseline through API errors and alerts on recovery', async () => {
    await foreverTick();
    failForever = true;
    await foreverTick();
    assert.deepEqual(messages, []);
    assert.equal(warnings.length, 2);
    failForever = false;
    setForeverStatus('DOWN');
    await foreverTick();
    assert.deepEqual(messages, ['WoW Forever (Americas & Oceania, PvE) is DOWN']);
  });

  it('rejects a missing status or a different ruleset without changing the baseline', async () => {
    await foreverTick();
    foreverResponse = { id: 2 };
    await foreverTick();
    foreverResponse = { id: 1, status: { type: 'DOWN' } };
    await foreverTick();
    assert.deepEqual(messages, []);
    assert.equal(warnings.length, 4);
    foreverResponse = { id: 2, status: { type: 'DOWN' } };
    await foreverTick();
    assert.deepEqual(messages, ['WoW Forever (Americas & Oceania, PvE) is DOWN']);
  });

  it('retries a notification after Discord delivery fails', async () => {
    await foreverTick();
    setForeverStatus('DOWN');
    failSend = true;
    await foreverTick();
    assert.deepEqual(messages, []);
    failSend = false;
    await foreverTick();
    await foreverTick();
    assert.deepEqual(messages, ['WoW Forever (Americas & Oceania, PvE) is DOWN']);
  });

  it('keeps retail alerts and Forever alerts independent during outages', async () => {
    await jobs[0].tick();
    await foreverTick();
    failForever = true;
    retailStatus = 'DOWN';
    await foreverTick();
    await jobs[0].tick();
    failForever = false;
    failRetail = true;
    setForeverStatus('DOWN');
    await jobs[0].tick();
    await foreverTick();
    assert.deepEqual(messages, [
      'Frostmourne is DOWN',
      'WoW Forever (Americas & Oceania, PvE) is DOWN',
    ]);
  });

  it('skips overlapping polls while a Forever request is still running', async () => {
    let release;
    let started;
    const pending = new Promise((resolve) => { release = resolve; });
    const received = new Promise((resolve) => { started = resolve; });
    waitForForever = async () => {
      started();
      await pending;
    };
    const firstTick = foreverTick();
    await received;
    await foreverTick();
    assert.equal(requests.length, 2);
    release();
    await firstTick;
    waitForForever = undefined;
    setForeverStatus('DOWN');
    await foreverTick();
    assert.deepEqual(messages, ['WoW Forever (Americas & Oceania, PvE) is DOWN']);
  });
});
