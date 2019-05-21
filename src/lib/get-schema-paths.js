import { getEntities } from 'src/lib/get-entities'
import forOwn from 'lodash/forOwn'
import camelCase from 'lodash/camelCase'
import pick from 'lodash/pick'
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { getConfig } from 'lib/get-config'

let schemaPath

/* const fs = require('fs')
 !fs.existsSync('tmp') && fs.mkdir('tmp') */

export async function getSchemaPaths () {
  if (schemaPath) {
    return schemaPath
  }

  schemaPath = {}

  // const { api: { permissionsPath } } = getConfig()
  // console.log({ permissionsPath })
  // const permissions = require(permissionsPath)
  const { entities } = await getEntities()

  forOwn(entities, (entity, entityName) => {
    entityName = camelCase(entityName)
    // fs.writeFileSync(`tmp/${modelName}.json`, JSON.stringify(_.get(model, 'schema'), null, 2))
    // todo: move $order and $render to ui
    // const appendExtraInfo = pick(permissions[entityName], ['$order', '$render'])

    merge(
      schemaPath,
      {
        [entityName]: JSON.parse(JSON.stringify(get(entity, 'schema.paths')))
      },
      {
        [entityName]: JSON.parse(JSON.stringify(mapValues(omit(get(entity, 'schema.virtuals'), ['id', '__v']), v => {
          return merge({
            options: {
              options: {
                virtual: true,
                readonly: true
                // hidden: true
              }
            }
          })
        })))
      }
    )
  })

  return schemaPath
}
