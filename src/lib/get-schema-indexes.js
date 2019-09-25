import { getEntities } from 'src/lib/get-entities'
import Promise from 'bluebird'
import merge from 'lodash/merge'

let schemaIndexes

/**
 * Retrieves models indexes
 * @return {Promise<*>}
 */
export async function getSchemaIndexes () {
  if (schemaIndexes) {
    return schemaIndexes
  }

  schemaIndexes = {}

  const { entities } = await getEntities()

  await Promise.each(Object.keys(entities), async (entityName) => {
    const entity = entities[entityName]
    const indexes = await entity.collection.getIndexes({ full: true })
    const sort = []
    const search = []
    indexes.forEach(v => {
      if (v.hasOwnProperty('weights')) {
        return search.push(...Object.keys(v.weights))
      }
      sort.push(...Object.keys(v.key))
    })
    merge(
      schemaIndexes,
      {
        [entityName]: {
          sort,
          search
        }
      }
    )
  })

  return schemaIndexes
}
