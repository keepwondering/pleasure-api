import { getConfig } from 'lib/get-config'
import { getSchemaPaths } from 'src/lib/get-schema-paths'
import forOwn from 'lodash/forOwn'
import get from 'lodash/get'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import defaults from 'lodash/defaults'

export default {
  prepare ({ router }) {
    const api = getConfig()

    let schemas

    getSchemaPaths()
      .then(entitiesSchema => {
        forOwn(entitiesSchema, (entity, entityName) => {
          forOwn(entity, (field, fieldName) => {
            const $pleasure = get(field, `options.$pleasure`)
            defaults(field, {
              path: fieldName,
              $pleasure
            })
            $pleasure && delete field.options.$pleasure
            entity[fieldName] = pick(field, ['path', 'instance', 'options', 'enumValues', '$pleasure'])
          })
          entitiesSchema[entityName] = omit(entitiesSchema[entityName], ['__v'])
        })
        // console.log({entitiesSchema})

        schemas = entitiesSchema
      })

    router.get(`${api.entitiesUri}`, async (ctx, next) => {
      if (!schemas) {
        console.log(`schemas not ready :\\`)
        return next()
      }

      ctx.$pleasure.res = schemas
      return next()
    })
  }
}
