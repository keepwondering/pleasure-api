import { getEntities } from 'lib/get-entities.js'
import { getPleasureEntityMap } from 'lib/get-pleasure-entity-map.js'
import { initializeEntities } from 'lib/initialize-entities.js'
import MongooseTypes from 'lib/mongoose-types/index.js'
import { pleasureApi } from 'lib/pleasure-api.js'
import { getMongoConnection, getMongoCredentials } from 'lib/get-mongoose-connection.js'
import { ApiError } from 'pleasure-api-client'
import plugins from 'lib/plugins/index.js'
import utils from 'lib/utils/index.js'
import { getPermissions } from 'lib/plugins/router/lib/get-permissions'
import { getPlugins } from 'lib/get-plugins'
import mongoose from 'mongoose'
import { getConfig } from 'lib/get-config.js'
import { getMongoose } from './lib/get-mongoose'
import cli from './lib/cli'

/**
 * RESTful API
 * @class API
 */

export {
  cli,
  getMongoose,
  getConfig,
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
  getPlugins
}
