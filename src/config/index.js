const defaultConfig = {
  name: 'Note.sv',
  defaultPasswordNote: {
    ttl: '',
    fid: '',
    pwd: '',
    url: '',
    otp: '',
    mem: ''
  },
  defaultNormalNote: {
    ttl: '',
    mem: ''
  },
  dateFormat: 'YYYY/MM/DD HH:mm:ss',
  backServer: 'https://back.note.sv/',
  faviconService: 'http://favicon.bbshare.net/',
  langOptions: [
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' }
  ],
  mnLangOptions: [
    { value: 'CHINESE', label: '中文' },
    { value: 'ENGLISH', label: 'English' },
    { value: 'FRENCH', label: 'French' },
    { value: 'ITALIAN', label: 'Italian' },
    { value: 'JAPANESE', label: '日本語' },
    { value: 'SPANISH', label: 'Spanish' }
  ],
  markdown: require('./markdown'),
  fixMDName: function (name) {
    if (!name) return ''
    return name.replace(/[\[\]\(\)\+\{\}&\|\\\*^%$#@\-|\s]/g, '')
  }

}

const developmentConfig = {
  // backServer: 'http://192.168.0.103/',
  console: console
}

const productionConfig = {
  console: {
    log: function () {},
    trace: function () {},
    debug: function () {},
    warn: function () {},
    error: function () {}
  }
}

const configFn = function () {
  if ( process.env.NODE_ENV === 'production' ) {
    return Object.assign( {}, defaultConfig, productionConfig )
  } else {
    return Object.assign( {}, defaultConfig, developmentConfig )
  }
}

export default configFn()
