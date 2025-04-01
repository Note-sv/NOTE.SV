import i18n from 'i18n-js'
import messages from './messages'

import config from '../../config'
const console = config.console

const langOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' }
]

i18n.defaultLocale = 'en'
i18n.locale = 'en'
i18n.translations = messages
i18n.fallbacks = true

export {
  i18n,
  langOptions
}
