import Router from 'koa-router'
import { getConfig } from 'lib/get-config'
import { getPlugins } from './get-plugins.js'
import eventsBus from 'lib/events-bus'
import { getEntities } from './get-entities'

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
 * @param {httpServer} server - http server. See {@link https://nodejs.org/api/http.html}
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

export function pleasureApi (config = {}, server) {
  const { on } = eventsBus()

  const { api: { prefix } } = getConfig({ api: config })
  const router = Router({
    prefix
  })

  const { prepare, extend, plugins, pluginsApi, pluginsConfig } = getPlugins(config)
  const mainPayload = { router, pluginsApi, server, pluginsConfig }

  const pluginRouter = ({ cb, config }) => {
    return cb(Object.assign({}, mainPayload, { config }))
  }

  plugins.forEach(plugin => {
    const { config = {}, schemaCreated, init, prepare: prepareCallback, extend: extendCallback } = plugin
    const pluginMainPayload = Object.assign({ config }, mainPayload)

    if (schemaCreated) {
      on('schema-created', (payload) => {
        schemaCreated(Object.assign({}, pluginMainPayload, payload))
      })
    }

    if (init) {
      on('pleasure-entity-map', (pleasureEntityMap) => {
        init(Object.assign({}, pluginMainPayload, { pleasureEntityMap }))
      })
    }

    if (prepareCallback) {
      prepare.push({ cb: prepareCallback, config })
    }
    if (extendCallback) {
      extend.push({ cb: extendCallback, config })
    }
  })

  prepare.forEach(pluginRouter)
  extend.forEach(pluginRouter)

  /*
  todo: this is a workaround in order for the koa-router to trigger middlewares without a specific path
    should be removed as koa-router 8 gets released.
    see: https://github.com/ZijianHe/koa-router/issues/462
   */
  router.all('*', (ctx, next) => {
    return next()
  })

  getEntities()
    .catch(err => {
      console.error(`An error occurred while loading the entities:`, err)
    })

  return router.routes()
}
