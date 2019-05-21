import castArray from 'lodash/castArray'

let io
let PleasureEntityMap

let getUserGroups

let fluxConfig

const fluxDelivery = (entityName, method, entry) => {
  if (!method || (entry && entry.$noFLux)) {
    return
  }

  if (!PleasureEntityMap) {
    console.error(`${ method } '${ entityName }' when not initialized.`)
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
  name: 'flux',
  init ({ pleasureEntityMap, pluginsApi, config }) {
    fluxConfig = config
    PleasureEntityMap = pleasureEntityMap
    io = pluginsApi.io.socketIo()
    getUserGroups = pluginsApi.io.getUserGroups
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
