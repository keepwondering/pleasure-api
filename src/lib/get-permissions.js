import { getEntities } from 'src/lib/get-entities'
import defaultPermissions from 'src/types/PleasurePermissions.js'
import merge from 'deepmerge'

export async function getPermissions () {
  const permissions = {}
  // todo: fix access
  const { schemas } = await getEntities()

  Object.keys(schemas).forEach(Entity => {
    permissions[Entity] = merge.all([{}, defaultPermissions, schemas[Entity].access || {}])
  })

  return permissions
}
