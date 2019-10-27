import { sanitateUrlParamsToMongoDriver } from 'src/lib/utils/sanitate-url-params-to-mongo-driver'
import qs from 'qs'
import { create, read, update, remove, list, push, pull } from './crud/index.js'
import { queryFilter } from './parse-query-filter'
import { resolvePleasureMethod } from './resolve-pleasure-method.js'
import merge from 'deepmerge'
import Boom from 'boom'
import { getPermissions } from 'src/lib/plugins/router/lib/get-permissions'
import { filterAccess } from './filter-access.js'
import { isObjectId } from 'src/lib/utils/is-object-id'
import get from 'lodash/get'
import camelCase from 'lodash/camelCase'
import Promise from 'bluebird'

let entities = null
let pleasureEntityModelMap = null
let permissions = null

export default {
  name: 'crud-router',
  prepare ({ router, getEntities }) {
    getEntities()
      .then(({ entities: e, schemas }) => {
        permissions = getPermissions(schemas)
        entities = e
        pleasureEntityModelMap = schemas
      })

    router.use((ctx, next) => {
      ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      ctx.set('Pragma', 'no-cache')
      ctx.set('Expires', '0')

      ctx.$pleasure.$api = {}

      // assign user from jwt-authentication, in case of any
      ctx.$pleasure.$api.user = ctx.$pleasure.user

      if (!entities || !permissions) {
        ctx.body = { initializing: true }
        return
      } else {
        ctx.$pleasure.$api.entities = entities
      }

      return next()
    })

    router.all('/:model/:id?/:entryPath?', async function (ctx, next) {
      if (!ctx.$pleasure.$api.entities) {
        return next()
      }

      let { model, id, entryPath } = ctx.params
      const { body: newEntry } = ctx.request
      // let entity = ctx.$pleasure.$api.entities[model]
      let entry

      if (!ctx.$pleasure.$api.entities[model]) {
        return next()
      }

      let entity = ctx.$pleasure.$api.entities[model] // mongoose.model(model)

      const { querystring } = ctx.request
      const params = sanitateUrlParamsToMongoDriver(qs.parse(querystring, { interpretNumericEntities: true }))

      let controller

      if (isObjectId(id)) {
        // store resolved entry in cache
        let resolvedEntry
        entry = () => {
          if (resolvedEntry) {
            return resolvedEntry
          }
          return entity.findById(id)
            .then(entry => {
              if (entry) {
                entry.$pleasure = ctx.$pleasure.$api
              }
              resolvedEntry = entry
              return entry
            })
        }
      } else if (id) {
        // treating id as an entity controller method
        const controllerMethod = id
        id = null
        const controllerPath = `controller.${ camelCase(controllerMethod) }`
        controller = get(pleasureEntityModelMap[model], controllerPath)

        if (!controller) {
          // id not valid and controller does not exists
          ctx.$pleasure.error(Boom.badRequest(`Invalid entity id or controller`))
          return next()
        }

        ctx.$pleasure.res = await controller.call(entity, {
          params,
          post: newEntry,
          user: ctx.$pleasure.user,
          ctx
        })

        return next()
      }

      const method = resolvePleasureMethod(ctx)

      if (!method) {
        return next()
      }

      Object.assign(ctx.$pleasure.$api, {
        queryFilter (cb) {
          return ctx.$pleasure.$api._queryFilter.push(cb)
        },
        execQueryFilter (entity) {
          return queryFilter(entity, ctx.$pleasure.$api._queryFilter)
        },
        overrideReadAccess (newAccess) {
          ctx.$pleasure.$api.overriddenReadAccess = newAccess
        },
        overriddenReadAccess: undefined,
        _queryFilter: [],
        entity,
        entry,
        newEntry,
        appendEntry: {},
        entryPath,
        id,
        method,
        params
      })

      ctx.$pleasure.$api.access = await permissions[model][method](ctx.$pleasure.$api)

      return next()
    })
  },
  methods: {
    getPermissions () {
      if (!pleasureEntityModelMap) {
        return
      }

      return getPermissions(pleasureEntityModelMap)
    }
  },
  extend ({ router }) {
    // list documents
    router.all('/:model/:id?/:entryPath?', async function (ctx, next) {
      const { newEntry, appendEntry, access, entity, method, overriddenReadAccess, params } = ctx.$pleasure.$api

      if (!entity || !method || !access) {
        return next()
      }

      const { model } = ctx.params
      let { pull: toPull, multiple } = params || {}

      let resolveFn = () => {}

      const { $api } = ctx.$pleasure

      const override = d => {
        return Object.assign({}, $api, d)
      }

      const entryGranted = filterAccess(newEntry, access)

      const newContent = override({
        entryGranted,
        entryResult: merge(entryGranted, appendEntry, {
          arrayMerge (destinationArray, sourceArray) {
            return sourceArray
          }
        })
      })

      switch (method) {
        case 'create':
          resolveFn = create.bind(null, newContent)
          break

        case 'read':
          resolveFn = read.bind(null, $api)
          break

        case 'update':
          resolveFn = update.bind(null, newContent)
          break

        case 'delete':
          resolveFn = remove.bind(null, $api)
          break

        case 'list':
          resolveFn = list.bind(null, $api)
          break

        case 'patch':
          resolveFn = patch.bind(null, newContent)
          break

        case 'push':
          resolveFn = push.bind(null, newContent)
          break

        case 'pull':
          resolveFn = pull.bind(null, Object.assign({ pull: toPull, multiple }, $api))
          break
      }

      const res = await resolveFn()
      const overrideMethods = {}

      if (method === 'create' && res._id) {
        let foundEntry
        Object.assign(overrideMethods, {
          isNew: true,
          async entry () {
            if (foundEntry) {
              return foundEntry
            }
            // to auto-populate...
            const entry = await entity.findById(res._id)

            if (entry) {
              entry.$pleasure = ctx.$pleasure.$api
            }

            foundEntry = entry

            return entry
          }
        })
      }

      const entryPermissionFilter = async (entry) => {
        const override = {}
        if (entry) {
          Object.assign(override, { entry () { return entry } })
        }
        return overriddenReadAccess || await permissions[model].read(Object.assign({}, ctx.$pleasure.$api, overrideMethods, override))
      }

      if (Array.isArray(res)) {
        ctx.$pleasure.res = await Promise.map(res, async entry => filterAccess(entry, await entryPermissionFilter(entry)))
      } else {
        ctx.$pleasure.res = filterAccess(res, overriddenReadAccess || await permissions[model].read(Object.assign({}, ctx.$pleasure.$api, overrideMethods)))
      }

      return next()
    })
  }
}
