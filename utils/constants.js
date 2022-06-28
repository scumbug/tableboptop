require('dotenv').config();
const itemList = [
  { itemName: 'Seria', role: process.env.SERIA_ROLE },
  { itemName: 'Wei', role: process.env.WEI_ROLE },
  { itemName: 'Madnick', role: process.env.MADNICK_ROLE },
  { itemName: 'Mokamoka', role: process.env.MOKAMOKA_ROLE },
  { itemName: 'Kaysarr', role: process.env.KAYSARR_ROLE },
  { itemName: 'Sian', role: process.env.SIAN_ROLE },
  { itemName: 'Rapport', role: process.env.RAPPORT_ROLE },
  { itemName: 'No Good Items', role: undefined },
];

const IMAGE_URL = 'https://lostmerchants.com/images/zones/';

const MONITOR_PERIOD = 24 * 60 * 1000;

const NAME_CLASS = '.ags-ServerStatus-content-responses-response-server-name';
const STATUS_CLASSES = [
  '.ags-ServerStatus-content-responses-response-server-status--maintenance',
  '.ags-ServerStatus-content-responses-response-server-status--good',
  '.ags-ServerStatus-content-responses-response-server-status--busy',
  '.ags-ServerStatus-content-responses-response-server-status--full',
];

module.exports = {
  itemList,
  NAME_CLASS,
  STATUS_CLASSES,
  IMAGE_URL,
  MONITOR_PERIOD,
};
