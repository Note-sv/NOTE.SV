const gulp = require('gulp')
const del = require('del')
const vinylPaths = require('vinyl-paths')
const shell = require('gulp-shell')
const { notarize } = require('electron-notarize')

// const console = require('tracer').console()

// gulp desktop桌面程序开发
exports.desktop = shell.task('./node_modules/.bin/quasar dev -m electron', { cwd: '.' })

// gulp notarize桌面版mac版认证
exports.notarize = () => {
  const appPath = 'dist/electron/Packaged/mac/NoteSV.app'
  const appleId = 'lilong@chainbow.io'
  const appleIdPassword = 'xnrt-qdrr-fotj-qcho'
  const ascProvider = 'Z3N6SZF439'
  const appBundleId = 'io.chainbow.notesv'

  return notarize({
    appBundleId,
    appPath,
    ascProvider,
    appleId,
    appleIdPassword
  })
}

// gulp buildDesktop桌面程序编译发布   -P always
exports.buildDesktop = gulp.series(shell.task('NODE_ENV=production GH_TOKEN=0cc791bdb81c1f3e8a979338dbf770c92ff9721b ./node_modules/.bin/quasar build -m electron -T all', { cwd: '.' }), exports.notarize)

// dist目录删除
exports.clean = function () {
  // 对dist目录转换为vinf虚拟文件流，然后使用del删除
  return gulp.src(['dist'], { read: false, allowEmpty: true })
    .pipe(vinylPaths(del))
}

// 更换Universal MobileNode.Framework
exports.copyUniversal = shell.task('cp -R src-capacitor/ios/nodejs-mobile-v0.3.2-ios/Release-universal/NodeMobile.framework src-capacitor/ios/App/', { cwd: '.' })

// 更换iPhoneOS MobileNode.Framework
exports.copyIos = shell.task('cp -R src-capacitor/ios/nodejs-mobile-v0.3.2-ios/Release-iphoneos/NodeMobile.framework src-capacitor/ios/App/', { cwd: '.' })

// 安装所有npm模块
exports.npm = gulp.series(shell.task('npm install', { cwd: '.' }), shell.task('npm install', { cwd: './src-capacitor' }), shell.task('npm install', { cwd: './src-capacitor/main-process' }))

// 手机模块开发模式编译
exports.capacitorProcess = gulp.series(shell.task('npm run dev', { cwd: './src-capacitor/main-process' }))
// 手机模块发布模式编译
exports.buildCapacitorProcess = gulp.series(shell.task('npm run build', { cwd: './src-capacitor/main-process' }))

// gulp ios移动app开发
exports.ios = gulp.series(exports.copyUniversal, gulp.parallel(exports.capacitorProcess, shell.task('./node_modules/.bin/quasar dev -m capacitor -T ios', { cwd: '.' })))

// gulp buildIos 发布准备
exports.buildIos = gulp.series(exports.copyIos, exports.buildCapacitorProcess, shell.task('NODE_ENV=production  ./node_modules/.bin/quasar build -m capacitor -T ios --ide', { cwd: '.' }))

// gulp android移动app开发
exports.android = gulp.parallel(exports.capacitorProcess, shell.task('./node_modules/.bin/quasar dev -m capacitor -T android', { cwd: '.' }))
// gulp buildAndroid 发布准备
exports.buildAndroid = gulp.series(exports.buildCapacitorProcess, shell.task('./node_modules/.bin/quasar build -m capacitor -T android --ide', { cwd: '.' }))
