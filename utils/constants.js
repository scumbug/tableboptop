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

const URL_REGEX =
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;

const NAME_CLASS = '.ags-ServerStatus-content-responses-response-server-name';
const STATUS_CLASSES = [
  '.ags-ServerStatus-content-responses-response-server-status--maintenance',
  '.ags-ServerStatus-content-responses-response-server-status--good',
  '.ags-ServerStatus-content-responses-response-server-status--busy',
  '.ags-ServerStatus-content-responses-response-server-status--full',
];

module.exports = {
  itemList,
  URL_REGEX,
  NAME_CLASS,
  STATUS_CLASSES,
};