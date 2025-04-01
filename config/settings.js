const settings = {
  donationAddress: '14wdnNuA1E6VTqCFFJSAnPTakV3CYfousR',
  feePerKb: 250, // 直通矿池的最低汇率
  woc: 'GYggPc9wLXcLKgVjCQyZHh5j', // WoC API Key
  chargeServices: {
    alipay: {
      desktop: true,
      mobile: false
    },
    wechatpay: {
      desktop: true,
      mobile: false
    },
    svcafe: {
      desktop: false,
      mobile: false
    },
    buybsv: {
      desktop: true,
      mobile: false
    },
    dotwallet: {
      desktop: true,
      mobile: false
    },
    moneybutton: {
      desktop: true,
      mobile: false
    },
    relayx: {
      desktop: true,
      mobile: false
    },
    wallet: {
      desktop: true,
      mobile: true
    }
  },
  bsvServices: {
    metasv: {
      desktop: true,
      mobile: true
    },
    electrum: {
      desktop: true,
      mobile: true
    }
  }

}

module.exports = settings
