import castArray from 'lodash/castArray'
import forOwn from 'lodash/forOwn'
import defaultsDeep from 'lodash/defaultsDeep'

let io
let PleasureEntityMap

let getUserGroups

let fluxConfig

/**
 * @typedef {Object} FluxConfig
 * @property {Function} getDeliveryGroup - Function called with the JWT user in session (if any, null otherwise)
 * that must resolve a {String} indicating the delivery group for the flux-pattern functionality. If none present will
 * default to `(auth) => { auth.level  || 'global' }`
 * @property {Object} payload - Holds all of the payload hooks
 * @property {Function} payload.create - Hook
 */

function fluxDelivery (entityName, method, entry) {
  if (!method || (entry && entry.$noFLux)) {
    return
  }

  if (!PleasureEntityMap) {
    return
  }

  let deliveryGroup = PleasureEntityMap[entityName].flux.access[method]({ entry })

  const getDeliveryPayload = group => {
    let payload = PleasureEntityMap[entityName].flux.payload[method]({ group, entry })

    if (!payload) {
      return
    }

    payload = Array.isArray(payload) || !(typeof payload === 'object' && 'toObject' in payload) ? payload : payload.toObject()

    return [method, { entry: payload, entity: entityName }]
  }

  if (!deliveryGroup) {
    return
  }

  if (typeof deliveryGroup === 'boolean') {
    deliveryGroup = getUserGroups()
  }

  castArray(deliveryGroup).forEach(group => {
    const payload = getDeliveryPayload(group)
    if (payload) {
      io.to(group).emit(...payload)
    }
  })
}

export default {
  config: {
    access: {
      /**
       * @callback Entity#flux#access#create
       * @param entry - The mongoose entry
       *
       * Called every time an entry that belongs to the entity is created. Must return an array indicating the
       * group of clients that should get notified. `true` for all, `false` for none. Defaults to `true`.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      create ({ entry }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#update
       * @param entry - The mongoose entry
       * @param entry.$before - The state of the entry before the update
       * @param entry.$after - The state of the entry after the update
       *
       * Called every time an entry that belongs to the entity is updated. Must return an array indicating the
       * group of clients that should get notified. `true` for all, `false` for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      update ({ entry }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#delete
       * @param {Object} entry - The mongoose entry being deleted
       *
       * Called every time an entry that belongs to the entity is deleted. Must return an array indicating the
       * group of clients that should get notified. `true` for all, `false` for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      delete ({ entry }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#updateMany
       * @param {Object[]} entries - Array with the entries being updated
       *
       * Called every time a bulk update is performed, e.g.
       * `pleasureClient.update('product', ['id1', 'id2'], {...})`.
       *
       * Must return an array indicating the group of clients that should get notified. `true` for all, `false`
       * for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      updateMany ({ entries }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#deleteMany
       * @param {Object[]} entries - Array with the entries being deleted
       *
       * Called every time a bulk delete is performed, e.g:
       * `pleasureClient.remove('product', ['id1', 'id2'], {...})`.
       *
       * deleted. Must return an array indicating the group of clients that should get notified. `true` for all, `false`
       * for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      deleteMany ({ entries }) {
        return ['admin']
      }
    },
    payload: {
      /**
       * @callback Entity#flux#payload#create
       * @param {String} group - Group where the payload is gonna be transmitted to
       * @param {Object} entry - The entry being created.
       *
       * Called every time an entry is created.
       * Must return the payload `Object` to be delivered or `falsy` to deliver nothing.
       *
       * @return {Object} - The payload that must be return to the `group`.
       */
      create ({ group, entry }) {
        return entry
      },
      /**
       * @callback Entity#flux#payload#update
       * @param {String} group - Group where the payload is gonna be transmitted to
       * @param {Object} entry - The entry being created.
       *
       * Called every time an entry is updated.
       * Must return the payload `Object` to be delivered or `falsy` to deliver nothing.
       *
       * @return {Object} - The payload that must be return to the `group`.
       */
      update ({ entry }) {
        return entry
      },
      /**
       * @callback Entity#flux#payload#delete
       * @param {String} group - Group where the payload is gonna be transmitted to
       * @param {Object} entry - The entry being created.
       *
       * Called every time an entry is deleted.
       * Must return the payload `Object` to be delivered or `falsy` to deliver nothing.
       *
       * @return {Object} - The payload that must be return to the `group`.
       */
      delete ({ entry }) {
        return entry
      },
      /**
       * @callback Entity#flux#payload#updateMany
       * @param {Object[]} entries - Array with the entries being updated
       *
       * Called every time a bulk update is performed, e.g.
       * `pleasureClient.update('product', ['id1', 'id2'], {...})`.
       *
       * Must return the payload `Object` (or `Array`) to be delivered. Anything `falsy` to deliver nothing.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      updateMany ({ entries }) {
        return false
      },
      /**
       * @callback Entity#flux#access#deleteMany
       * @param {Object[]} entries - Array with the entries being deleted
       *
       * Called every time a bulk delete is performed, for example, by using the  that belongs to the entity is
       * deleted. Must return an array indicating the group of clients that should get notified. `true` for all, `false`
       * for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      deleteMany ({ entries }) {
        return false
      }
    }
  },
  name: 'flux',
  init ({ pleasureEntityMap, pluginsApi, config }) {
    fluxConfig = config
    PleasureEntityMap = pleasureEntityMap
    io = pluginsApi.io.socketIo()
    getUserGroups = pluginsApi.io.getUserGroups

    forOwn(pleasureEntityMap, (entity, entityName) => {
      defaultsDeep(entity, { flux: config })
    })
  },
  schemaCreated ({ entityName, mongooseSchema }) {
    mongooseSchema.post('init', function (entry) {
      entry.$before = entry.toObject()
    })

    mongooseSchema.post('save', function (entry) {
      entry.$after = entry.toObject()
      const method = entry.wasNew ? 'create' : 'update'
      fluxDelivery(entityName, method, entry)
    })

    mongooseSchema.post('remove', { query: true, document: true }, fluxDelivery.bind(null, entityName, 'delete'))

    mongooseSchema.post('deleteMany', {
      query: true,
      document: true
    }, fluxDelivery.bind(null, entityName, 'deleteMany'))

    mongooseSchema.post('updateMany', {
      query: true,
      document: true
    }, fluxDelivery.bind(null, entityName, 'updateMany'))
  },
  methods: {
    fluxDelivery
  }
}
