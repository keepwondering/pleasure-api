import { getConfig } from 'lib/get-config'
import { getSchemaPaths } from 'src/lib/get-schema-paths'
import { getSchemaIndexes } from 'src/lib/get-schema-indexes'
import forOwn from 'lodash/forOwn'
import get from 'lodash/get'
import merge from 'deepmerge'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import flatten from 'lodash/flatten'
import defaults from 'lodash/defaults'
import Promise from 'bluebird'
import { getPermissions } from './router/lib/get-permissions.js'
import PleasureContext from './router/types/PleasureContext.js'

export default {
  name: 'schemas',
  prepare ({ router, pleasureEntityMap }) {
    const api = getConfig()
    const permissions = getPermissions(pleasureEntityMap)
    let schemas
    let originalSchemas

    getSchemaPaths()
      .then(entitiesSchema => {
        originalSchemas = Object.assign({}, entitiesSchema)
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
          entitiesSchema[entityName] = omit(entitiesSchema[entityName], ['__v', '__t'])
        })
        // console.log({entitiesSchema})

        schemas = entitiesSchema
      })

    router.get(`${ api.entitiesUri }`, async (ctx, next) => {
      if (!schemas) {
        return next()
      }

      // handling permissions by request auth
      const auth = {}
      const { user } = ctx.$pleasure

      await Promise.each(Object.keys(pleasureEntityMap), async (entity) => {
        const granted = await permissions[entity].schema(PleasureContext({
          schema: true,
          user,
          ctx,
          entity
        }))

        if (granted) {
          auth[entity] = granted
        }
      })

      const granted = flatten(Object.keys(auth).map(model => {
        const access = auth[model]
        if (Array.isArray(access)) {
          return access.map(field => `${ model }.${ field }`)
        }

        return model
      }))

      const indexes = await getSchemaIndexes()
      const grantedSchemas = Object.assign({}, pick(schemas, granted))

      forOwn(grantedSchemas, (schema, schemaName) => {
        grantedSchemas[schemaName] = merge(schema, {
          $pleasure: { index: indexes[schemaName] }
        })
      })

      ctx.$pleasure.res = grantedSchemas
      return next()
    })
  }
}
