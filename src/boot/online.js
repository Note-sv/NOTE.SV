import { i18n } from './i18n'

export default ( { app, store, Vue } ) => {
  window.addEventListener('online', function handleOnline (e) {
    Vue.prototype.$q.notify({
      color: 'positive',
      message: i18n.t('Online'),
      position: 'top'
    })
  })

  window.addEventListener('offline', function handleOffline (e) {
    Vue.prototype.$q.notify({
      color: 'negative',
      message: i18n.t('Offline'),
      position: 'top'
    })
  })
}
