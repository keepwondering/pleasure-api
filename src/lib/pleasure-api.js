import Router from 'koa-router'
import { getConfig, setConfig } from './get-config.js'
import { getMongoose } from './get-mongoose.js'
import mongoose from 'mongoose'
import { getPlugins } from './get-plugins.js'
import { overwriteMerge, EventBus, getConfig as _getConfig } from 'pleasure-utils'
import { getEntities } from './get-entities'
import merge from 'deepmerge'

/**
 * @function API.pleasureApi
 * @desc Initializes the Data API. This function returns a `koa` plugin orchestrating all of the Data API logic.
 *
 * ```mermaid
 * graph LR
 * A[pleasure] --> B(API)
 * B --> |flux| C
 * D(UI) --> C(Client)
 * C --> |req| B
 * B --> |res| C
 * ```
 *
 * @param {ApiConfig} config - Override local API configuration. See {@link ApiConfig}
 * @param {Server} server - http server. See {@link https://nodejs.org/api/http.html}
 * @return {Function} Koa Plugin.
 *
 * @example <caption>koa as the http server</caption>
 *
 * ```js
 * const { pleasureApi } = require('pleasure')
 * const Koa = require('koa')
 *
 * const app = new Koa()
 * const server = app.listen(3000)
 *
 * app.use(pleasureApi({
 *   prefix: '/api'
 * }, server))
 * ```
 *
 * @example <caption>Using a custom http server</caption>
 *
 * ```js
 * const { pleasureApi } = require('pleasure')
 * const Koa = require('koa')
 * const server = require('http').createServer()
 *
 * const app = new Koa()
 *
 * app.use(pleasureApi({
 *   prefix: '/api'
 * }, server))
 *
 * server.listen(3000, app.callback())
 * ```
 */

export function pleasureApi (config, server) {
  // set default config
  const { prefix } = getConfig(config)
  const { on } = EventBus()

  const router = Router({
    prefix
  })

  const { prepare, extend, plugins, pluginsApi, pluginsConfig } = getPlugins(config)

  /**
   * @typedef {Object} PleasureApi.PluginPayload
   * @property {mongoose} mongoose - The mongoose module. {@see https://mongoosejs.com/}
   * @property {mongoose} mongooseApi - The mongoose instance used by the API. {@see https://mongoosejs.com/}
   * @property router - The koa router instance. {@see https://github.com/ZijianHe/koa-router}
   * @property pluginsApi - The koa router instance. {@see https://github.com/ZijianHe/koa-router}
   * @property server - The http server instance. {@see https://nodejs.org/api/http.html#http_class_http_server}
   * @property {Object} pluginsConfig - Object containing all configurations of all plugins. Keyed by plugin name.
   * @property {API.getEntities} getEntities - {@see API.getEntities}
   * @property {API.getConfig} getConfig - {@see API.getConfig}
   * @property {Object} config - Plugin's merged config. The result of merging the default values of the plugin with those
   * set by the user locally in the pleasure.config.js file.
   */

  const mainPayload = {
    mongoose,
    mongooseApi: getMongoose(),
    router,
    pluginsApi,
    server,
    pluginsConfig,
    getEntities,
    getConfig
  }

  const pluginRouter = ({ cb, config }) => {
    return cb(Object.assign({}, mainPayload, { config }))
  }

  plugins.forEach(plugin => {
    const { name, config = {}, schemaCreated, init, prepare: prepareCallback, extend: extendCallback } = plugin
    // console.log({ name, config })
    merge(config, getConfig()[name] || {}, {
      arrayMerge: overwriteMerge
    })
    // console.log({ config })
    const pluginMainPayload = Object.assign({ config }, mainPayload)

    if (schemaCreated) {
      on('schema-created', (payload) => {
        schemaCreated(Object.assign({}, pluginMainPayload, payload))
      })
    }

    if (init) {
      init(pluginMainPayload)
    }

    if (prepareCallback) {
      prepare.push({ cb: prepareCallback, config, name })
    }

    if (extendCallback) {
      extend.push({ cb: extendCallback, config, name })
    }
  })

  on('pleasure-entity-map', (pleasureEntityMap) => {
    Object.assign(mainPayload, { pleasureEntityMap })
    prepare.forEach(pluginRouter)
    extend.forEach(pluginRouter)
  })

  /*
  todo: this is a workaround in order for the koa-router to trigger middlewares without a specific path
    should be removed as koa-router 8 gets released.
    see: https://github.com/ZijianHe/koa-router/issues/462
   */
  router.all('*', (ctx, next) => {
    return next()
  })

  getEntities()
    .then(() => {
      const { debug } = _getConfig()
      debug && console.log(`pleasure api initialized`)
    })
    .catch(err => {
      console.error(`An error occurred while loading the entities:`, err)
    })

  return router.routes()
}
