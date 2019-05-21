import mongoose from 'mongoose'
import { getConfig } from 'lib/get-config'

/**
 * @typedef MongoClient
 * @type Object
 * @ignore
 * @see http://mongodb.github.io/node-mongodb-native/3.2/api/MongoClient.html#.connect
 */

/**
 * @typedef mongoose
 * @type Object
 * @ignore
 * @see https://mongoosejs.com/
 */

mongoose.set('useCreateIndex', true)

mongoose.Promise = require('bluebird')
mongoose.plugin(require('mongoose-beautiful-unique-validation'))
mongoose.plugin(require('mongoose-autopopulate'))
// mongoose.plugin(require('./enum-remote'))

const pif = (w, what = null) => {
  return w ? what || w : ''
}

export function getMongoCredentials (additional = {}) {
  const { api: { mongodb } } = getConfig({ api: { mongodb: additional } })
  return mongodb
}

export function getMongoUri (credentials = {}) {
  const { username, password, host, port, database } = getMongoCredentials(credentials)
  // console.log({ host, database })
  return `mongodb://${ pif(username) }${ pif(password, ':' + password) }${ pif(username, '@') }${ host }:${ port }/${ database }`
}

/**
 * @typedef {Object} API.MongoDBConfig
 * @property {String} host=localhost - MongoDB host
 * @property {Number} port=27017 - MongoDB port
 * @property {Number} database=<project-name> - kebabCase representation of the project name
 * @property {String} [username] - MongoDB username
 * @property {String} [password] - MongoDB password
 */

/**
 * Establishes a connection to a mongoDB server and returns the connection.
 *
 * @method API.getMongoConnection
 * @param {API.MongoDBConfig} [config] - Optional configuration object to override local configuration.
 * @see {@link API.MongoDBConfig}
 *
 * @return {Object} The mongodb connection
 *
 * @example Handling DB errors
 *
 * ```js
 * const { api: { getMongoConnection }, getConfig } = require('pleasure')
 * const conn = getMongoConnection()
 *
 * conn.on('connected', () => {
 *   const { api: { MongoDBConfig: { host, port, database } } } = getConfig()
 *   console.log(`Connected to ${host}:${port}/${database}`)
 * })
 *
 * conn.on('error', (err) => {
 *   console.log(`A mongoDB error occurred`)
 * })
 * ```
 */
export function getMongoConnection (config = {}) {
  const { api: { debug, mongodb: { driverOptions } } } = getConfig({ api: { mongodb: config } })

  const connection = mongoose
    .createConnection(getMongoUri(config), driverOptions)

  connection.on('connected', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB connected')
  })

  connection.on('disconnected', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB disconnected')
  })

  connection.on('reconnected', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB reconnected')
  })

  connection.on('error', function (err) {
    if (!debug) {
      return
    }

    console.log('MongoDB event error: ' + err)
  })

  connection.on('close', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB closed')
  })

  return connection
}

module.exports = { getMongoConnection, getMongoUri }
