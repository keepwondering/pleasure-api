import Entity from 'src/types/Entity.js'
import { getConfig } from 'lib/get-config.js'
import { readdirAsync } from 'lib/tools/readdir-async.js'
import { getCollectionName } from './get-collection-name.js'
import { findRoot } from 'lib/utils/find-root'
import path from 'path'
import merge from 'deepmerge'

/**
 * @typedef {Object} PleasureEntityMap
 *
 * An object keyed by collection name containing it's {@link Entity}
 *
 * @example
 *
 * module.exports = {
 *   someEntityName: {}, // Entity
 *   someOtherEntityName: {} // Entity
 * }
 */

/**
 * Resolves the project entities.
 * @async
 * @returns {Promise<PleasureEntityMap>} - An object with all PleasureEntities
 * @see PleasureEntityMap
 */
export async function getPleasureEntityMap () {
  const { api: { entitiesPath } } = getConfig()
  const schemaFiles = await readdirAsync(findRoot(entitiesPath))

  const PleasureSchemaMap = {}

  schemaFiles.filter(file => /\.js/.test(file)).forEach(entity => {
    const schemaPath = findRoot(entitiesPath, entity)
    // todo: fix access, make it extendable
    const pleasureEntity = require(schemaPath)

    const name = pleasureEntity.name || getCollectionName(path.parse(entity).name)

    PleasureSchemaMap[name] = merge.all([Entity, pleasureEntity, { name }])
  })

  return PleasureSchemaMap
}
