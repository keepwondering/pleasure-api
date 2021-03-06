import helmet from './plugins/helmet'
import pleasureContext from './plugins/pleasure-context'
import jwtAuthentication from 'pleasure-api-plugin-jwt'
import schemas from './plugins/schemas'
import socketIo from 'pleasure-api-plugin-socket-io'
import fluxPattern from 'pleasure-api-plugin-flux'
import apiRouter from './plugins/router'
import castArray from 'lodash/castArray'
import pleasureResponse from './plugins/pleasure-response'
import merge from 'deepmerge'
import get from 'lodash/get'
import { getConfig } from './get-config.js'
import { overwriteMerge } from 'pleasure-utils'

export function getPlugins (configOverride) {
  const api = getConfig(configOverride)

  let plugins = [helmet, pleasureContext, jwtAuthentication, schemas, socketIo, fluxPattern, apiRouter, ...castArray(api.plugins)]
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
    const pluginConfig = merge.all([{}, config || {}, get(api, plugin.name, {})], {
      arrayMerge: overwriteMerge
    })

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
