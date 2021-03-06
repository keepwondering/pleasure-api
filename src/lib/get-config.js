import { overwriteMerge, packageJson, extendConfig, getConfig as _getConfig, mergeConfigWithEnv } from 'pleasure-utils'
import kebabCase from 'lodash/kebabCase'
import merge from 'deepmerge'
import Promise from 'bluebird'

const { name } = packageJson()

let init

const _default = {
  prefix: '/api',
  port: 3000,
  collectionListLimit: 100,
  collectionMaxListLimit: 300,
  createEntityTimeout: 3000,
  mongodb: {
    host: 'localhost',
    port: 27017,
    database: kebabCase(name),
    username: null,
    password: null,
    driverOptions: {
      autoIndex: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 500,
      promiseLibrary: Promise,
      poolSize: 5,
      useNewUrlParser: true
    }
  },
  entitiesPath: 'api', // relative to <project-root>
  entitiesUri: '/entities'
}

/**
 * @typedef {Array} TimeUnit
 *
 * An Array representing a length of time in the form of:
 * [amount, unit] as specified by [moment.js#add]{@link https://momentjs.com/docs/#/durations/add/}
 *
 * @property {Number} 0 - Amount of 'units'
 * @property {String} 0 - Unit of time. ie: months, weeks, minutes, seconds, etc.
 */

/**
 * @typedef {Object} API.ApiConfig
 * @summary: The API configuration object.
 * @desc The way to setup
 *
 * @property {String} [prefix=/api] - URI Prefix where to expose the API. `null` for `/`
 * @property {Number} [port=3000] - Default port where to start the application via `$ pls app start`.
 * @property {Number} [timeout=15000] - Specifies how long a client must wait for the api to respond, in milliseconds
 * @property {Number} [collectionListLimit=100] - Default collection list limit
 * @property {Number} [collectionMaxListLimit=300] - Maximum list limit to be set by a client
 * @property {Number} [createEntityTimeout=3000] - Milliseconds to wait for mongoose to connect to MongoDB and
 * initialize all of the schemas. Would raise an "Entity creation timeout" error after this time.
 * @property {MongoDBConfig} mongodb - MongoDB credentials
 * @property {String} [entitiesPath=api/] - Path from where to load files containing #Entity, relative to project root
 * @property {String} [entitiesUri=/entities] - URI where to expose the #PleasureEntityMap
 * @property {ApiPlugin[]} [plugins] - Optional {@link ApiPlugin}'s to hook when used via cli `$ pls app start`.
 * @property {Object} [ui] - Optional object configuration for `nuxt-pleasure`.
 * @property {Object} [ui.postCssVariables] - Optional object variables for `postcss-css-variables`.
 * @property {String[]} [ui.watchForRestart] - Array of files or directories to watch and auto restart the application.
 * @example PostCSS Variables
 *
 * ```js
 * module.exports = {
 *   api: {
 *     postCssVariables: {
 *       theme: {
 *         profile: {
 *           background: `#fc0`, // can be accessed via var(--theme-profile-background) in any postcss scope
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 */

/**
 * @method API.getConfig
 * @param {Object} [override] - Optionally overrides local config
 * @return {ApiConfig}
 */

export function getConfig (override = {}) {
  if (init) {
    return init
  }

  const apiConfig = merge.all([{}, _default, _getConfig('api', override, false, false)], {
    arrayMerge: overwriteMerge
  })

  return mergeConfigWithEnv(apiConfig, 'PLEASURE_API')
}

extendConfig('api', getConfig)

export function setConfig (config) {
  return init = config
}
