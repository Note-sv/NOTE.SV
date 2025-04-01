const config = {
  console: console,
  appName: 'NoteSV',
  // 缺省的系统设置
  systemSettings: require('./settings'),

  currencies: require('./currencies.js').default,

  servers: require('./servers.js').default,
  whitelist: new RegExp('moneybutton', 'i'),
  userAgent: `Note.SV/${require('../package.json').version}`,
  backServer: 'https://back.note.sv/',
  domailTld: 'note.sv',
  updateFeed: {
    provider: 'github',
    owner: 'Note-sv',
    repo: 'note.sv'
  }
}

export default config
