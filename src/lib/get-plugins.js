import helmet from './plugins/helmet'
import pleasureContext from './plugins/pleasure-context'
import jwtAuthentication from './plugins/jwt-authentication'
import schemas from './plugins/schemas'
import socketIo from './plugins/socket-io'
import fluxPattern from './plugins/flux-pattern'
import apiRouter from './plugins/router'
import castArray from 'lodash/castArray'
import pleasureResponse from './plugins/pleasure-response'
import merge from 'deepmerge'
import get from 'lodash/get'
import { getConfig } from './get-config.js'

export function getPlugins (configOverride) {
  const api = getConfig(configOverride)

  let plugins = [helmet, pleasureContext, jwtAuthentication, schemas, socketIo, fluxPattern, apiRouter].concat(castArray(api.plugins))
  plugins.push(pleasureResponse) // last plugin is the response handler

  // called before the api logic... schemas are called the last
  const prepare = []

  // called after the api logic...
  const extend = []

  const pluginsApi = {}
  const pluginsConfig = {}

  plugins = plugins.filter(Boolean)

  plugins.forEach(plugin => {
    const { config = {} } = plugin
    const pluginConfig = merge.all([{}, config || {}, get(api, plugin.name, {})])

    if (!plugin.methods) {
      return
    }

    if (!plugin.name) {
      throw new Error(`plugin exporting methods but no name was assigned: ${ JSON.stringify(plugin) }`)
    }

    pluginsConfig[plugin.name] = plugin.config = pluginConfig
    pluginsApi[plugin.name] = plugin.methods
  })

  return { prepare, extend, pluginsApi, pluginsConfig, plugins }
}
