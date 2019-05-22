import defaultPermissions from '../types/ApiAccess.js'
import merge from 'deepmerge'

/**
 *
 * @param {Object} schemas - Schema map
 * @return {Promise<void>}
 */
export function getPermissions (schemas) {
  const permissions = {}
  // todo: fix access
  Object.keys(schemas).forEach(Entity => {
    permissions[Entity] = merge.all([{}, defaultPermissions, schemas[Entity].access || {}])
  })

  return permissions
}
