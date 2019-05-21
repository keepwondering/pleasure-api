// const commandLineArgs = require('command-line-args')
const bunyan = require('bunyan')
const consts = require('./consts')
const _ = require('lodash')
const path = require('path')
const config = require('../../nuxt.config.js')
const mkdirp = require('mkdirp')

const { LOG_DIR, NODE_ENV } = process.env
const isWin = /^win/.test(process.platform)
let logDir = LOG_DIR || (isWin ? 'C:\\\\log' : (config.dev ? path.join(__dirname, '../../logs') : '/var/log'))
mkdirp.sync(logDir)
logDir = logDir.replace(/(\\|\/)+$/, '') + (isWin ? '\\\\' : '/')

const accessLog = path.join(logDir, `${_.kebabCase(consts.PROJECT_NAME)}-access-${NODE_ENV}.log`)
const appAccessLog = path.join(logDir, `${_.kebabCase(consts.PROJECT_NAME)}-app-access-${NODE_ENV}.log`)
const errorLog = path.join(logDir, `${_.kebabCase(consts.PROJECT_NAME)}-error-${NODE_ENV}.log`)
const appErrorLog = path.join(logDir, `${_.kebabCase(consts.PROJECT_NAME)}-app-error-${NODE_ENV}.log`)

const access = {
  type: 'rotating-file',
  path: accessLog,
  level: config.dev ? 'debug' : 'info',
  period: '1d',
  count: 4
}

const error = {
  type: 'rotating-file',
  path: errorLog,
  level: 'error',
  period: '1d',
  count: 4
}

const appInfo = {
  type: 'rotating-file',
  path: appAccessLog,
  level: config.dev ? 'debug' : 'info',
  period: '1d',
  count: 4
}

const appError = {
  type: 'rotating-file',
  path: appErrorLog,
  level: 'error',
  period: '1d',
  count: 4
}

const logger = bunyan.createLogger({
  name: _.kebabCase(consts.PROJECT_NAME),
  streams: [access, error]
})

const appLogger = bunyan.createLogger({
  name: `APP-${_.kebabCase(consts.PROJECT_NAME)}`,
  streams: [appInfo, appError]
})

module.exports = {
  logger,
  appLogger
}
