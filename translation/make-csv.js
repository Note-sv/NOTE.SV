// 从i8n导入数据

import i18nData from '../src/i18n/index.js'
import _ from 'lodash'

const en = i18nData.en
const ja = i18nData.ja
const zh = i18nData.zh

console.log('Key,English,Chinese,Japanese')
_.each(en, (value, key) => {
  console.log(`${key},"${value}","${zh[key]}","${ja[key]}"`)
})
