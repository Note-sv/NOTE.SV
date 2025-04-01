// Configuration for your app
// https://quasar.dev/quasar-cli/quasar-conf-js
const TerserPlugin = require('terser-webpack-plugin')

module.exports = function ( ctx ) {
  return {
    version: '1.9.6',
    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://quasar.dev/quasar-cli/cli-documentation/boot-files
    boot: [
      'i18n',
      'axios',
      'status-watch',
      'router-auth',
      'online',
      'mavon-editor',
      ctx.mode.capacitor ? 'push-service' : '',
      ctx.mode.capacitor ? 'qr-reader' : ''
    ],

    // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-css
    css: [
      'app.scss'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v4',
      // 'fontawesome-v5',
      // 'eva-icons',
      // 'themify',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons' // optional, you are not bound to it
    ],

    // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
    framework: {
      // iconSet: 'ionicons-v4', // Quasar icon set
      // lang: 'de', // Quasar language pack

      // Possible values for "all":
      // * 'auto' - Auto-import needed Quasar components & directives
      //            (slightly higher compile time; next to minimum bundle size; most convenient)
      // * false  - Manually specify what to import
      //            (fastest compile time; minimum bundle size; most tedious)
      // * true   - Import everything from Quasar
      //            (not treeshaking Quasar; biggest bundle size; convenient)
      all: 'importStrategy',

      components: [],
      directives: [],

      // Quasar plugins
      plugins: [
        'Notify', 'Dialog', 'Loading',
        'LocalStorage', 'SessionStorage'
      ],
      config: {
        notify: { /* Notify defaults */ }
      }
    },

    // https://quasar.dev/quasar-cli/cli-documentation/supporting-ie
    supportIE: false,

    // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
    build: {
      scopeHoisting: true,
      // vueRouterMode: 'history',
      // showProgress: false,
      // gzip: true,
      // analyze: true,
      // extractCSS: false,

      // https://quasar.dev/quasar-cli/cli-documentation/handling-webpack
      extendWebpack ( cfg ) {
        console.log(cfg)
        cfg.module.rules.push( {
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /node_modules/
        } )
        cfg.module.rules.push( {
          test: /\.md$/i,
          use: 'raw-loader'
        } )
      }
    },

    // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-devServer
    devServer: {
      // https: true,
      // port: 8080,
      open: true // opens browser window automatically
    },

    // animations: 'all', // --- includes all animations
    // https://quasar.dev/options/animations
    animations: [],

    // https://quasar.dev/quasar-cli/developing-ssr/configuring-ssr
    ssr: {
      pwa: false
    },

    // https://quasar.dev/quasar-cli/developing-pwa/configuring-pwa
    pwa: {
      // workboxPluginMode: 'InjectManifest',
      // workboxOptions: {}, // only for NON InjectManifest
      manifest: {
        name: 'NOTE.SV',
        short_name: 'NOTE.SV',
        description: 'A Crypto Note app powered by Bitcoin SV',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#027be3',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    },

    // https://quasar.dev/quasar-cli/developing-cordova-apps/configuring-cordova
    cordova: {
      // id: 'io.chainbow.metanet',
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // https://quasar.dev/quasar-cli/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,

      appId: 'io.chainbow.notesv',

      // Your app's name.
      appName: 'NOTE.SV'

    },

    // https://quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
    electron: {
      bundler: 'builder', // or 'packager'

      // packager: {
      //   // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
      //   all: true,
      //   // OS X / Mac App Store
      //   appBundleId: 'io.chainbow.notesv',
      //   appCategoryType: 'Utility',
      //   osxSign: 'Developer ID Application: ChainBow Co. Ltd (Z3N6SZF439)'
      //   // protocol: 'note://'

      //   // Windows only
      //   // win32metadata: { ... }
      // },

      builder: {
        // https://www.electron.build/configuration/configuration
        appId: 'io.chainbow.notesv',
        productName: 'NoteSV',
        copyright: 'Copyright © 2020,2021 ChainBow Co. Ltd.',
        protocols: {
          name: 'NoteSV',
          schemes: ['notesv']
        },
        mac: {
          category: 'public.app-category.productivity',
          artifactName: '${productName}-${version}-${os}.${ext}',
          target: [
            // 'mas',
            // 'pkg',
            'dmg',
            'zip'
          ],
          // provisioningProfile: 'build/NoteSV_Profile.provisionprofile',
          publish: ['github']
        },
        // dmg: {
        //   title: 'Note.SV',
        //   // background: 'build/background.png',
        //   icon: 'build/icon.icns',
        //   publish: ['github']
        // },
        mas: {
          hardenedRuntime: false, // IMPORTANT!!!!
          type: 'distribution',
          category: 'public.app-category.productivity',
          entitlements: 'build/entitlements.mas.plist',
          entitlementsInherit: 'build/entitlements.mas.inherit.plist'
        },
        win: {
          target: 'nsis',
          icon: 'build/icon.icns',
          artifactName: '${productName}-${version}-${os}.${ext}',
          publish: ['github']
        },
        linux: {
          target: 'AppImage',
          publish: ['github']
        },
        nsis: {
          deleteAppDataOnUninstall: true,
          createDesktopShortcut: 'always'
          // include: 'nsis.nsh'
        },
        publish: null
        // publish: {
        //   'provider': 's3',
        //   'bucket': 'myS3bucket'
        // }
      },

      // keep in sync with /src-electron/main-process/electron-main
      // > BrowserWindow > webPreferences > nodeIntegration
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true,

      extendWebpack ( cfg ) {
        // do something with Electron main process Webpack cfg
        // chainWebpack also available besides this extendWebpack
        // cfg.devtool = 'source-map'
        console.log(cfg)
        cfg.optimization.minimizer = [
          new TerserPlugin({
            extractComments: 'all',
            terserOptions: {
              compress: {
                drop_console: true
              }
            }
          })
        ]
      }
    }

  }
}
