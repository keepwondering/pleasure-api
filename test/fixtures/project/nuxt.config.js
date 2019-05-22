const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  dev: isDev,
  srcDir: path.join(__dirname, 'client'),
  vue: {
    config: {
      productionTip: isDev,
      devtools: isDev,
      silent: !isDev,
      performance: isDev
    }
  }
}
