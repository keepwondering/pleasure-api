import { getEntities } from './lib/get-entities.js'
import { getPleasureEntityMap } from './lib/get-pleasure-entity-map.js'
import { initializeEntities } from './lib/initialize-entities.js'
import MongooseTypes from './lib/mongoose-types/index.js'
import { pleasureApi } from './lib/pleasure-api.js'
import * as server from './lib/server.js'
import { getMongoConnection, getMongoCredentials } from './lib/get-mongoose-connection.js'
import { ApiError } from 'pleasure-client'
import plugins from 'src/lib/plugins/index.js'
import utils from 'src/lib/utils/index.js'
import { getPermissions } from 'src/lib/get-permissions'
import { getPlugins } from 'src/lib/get-plugins'
import mongoose from 'mongoose'

/**
 * RESTful API
 * @class API
 */

export const api = {
  getMongoCredentials,
  getEntities,
  getPleasureEntityMap,
  initializeEntities,
  MongooseTypes,
  pleasureApi,
  utils,
  getMongoConnection,
  ApiError,
  plugins,
  mongoose,
  getPermissions,
  server,
  getPlugins
}
