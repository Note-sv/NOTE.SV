module.exports = {
  presets: [
    '@quasar/babel-preset-app'
  ],
  sourceMaps: true,
  retainLines: true,
  plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-object-rest-spread']
}
