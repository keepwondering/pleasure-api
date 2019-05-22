import { findRoot, readdirAsync } from 'pleasure-utils'
import { getConfig } from './get-config.js'
import Entity from 'src/types/Entity.js'
import { getCollectionName } from './get-collection-name.js'
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
  const { entitiesPath } = getConfig()
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
