import { getPleasureEntityMap } from './get-pleasure-entity-map.js'
import { getMongoose } from 'src/lib/utils/get-mongoose'
import { Schema } from 'mongoose'
import merge from 'deepmerge'
import defaults from 'lodash/defaults'
import { EventBus } from 'pleasure-utils'
import Entity from 'src/types/Entity'
import ApiAccess from 'src/lib/plugins/router/types/ApiAccess'

export async function initializeEntities () {
  const { emit } = EventBus()
  const entities = {}
  const mongoose = getMongoose()
  const pleasureEntityMap = await getPleasureEntityMap()
  const discriminated = []
  const extended = []
  const initFns = []

  const exhaust = (arr, cb) => {
    while (arr.length > 0) {
      let initLength = arr.length
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i]
        if (cb(item)) {
          arr.splice(i, 1)
          i--
        }
      }
      if (arr.length === initLength) {
        throw new Error(`Infinite iteration.`)
      }
    }
  }

  const createSchema = (entityName) => {
    if (entities[entityName]) {
      return
    }

    //console.log({ entityName })
    const { extend, discriminator, model, name, access } = pleasureEntityMap[entityName]

    if (!model) {
      console.error(`Entity ${ entityName } is missing the model.`)
      return
    }

    if (extend) {
      return createSchema(defaults(pleasureEntityMap[entityName], pleasureEntityMap[extend]))
    }

    if (
      (discriminator && !entities[discriminator]) ||
      (extend && !entities[extend]) ||
      (extend && discriminator)
    ) {
      return
    }

    const mongooseSchema = new Schema(model.schema, merge({
      toObject: {
        virtuals: true
      },
      toJSON: {
        virtuals: true
      }
    }, model.schemaOptions || {}))

    mongooseSchema.pre('save', function (next) {
      if (this.isNew) {
        this.wasNew = this.isNew
      }
      next()
    })

    // triggers created
    model.schemaCreated && model.schemaCreated(mongooseSchema)
    emit('schema-created', { entityName, mongooseSchema })

    const mongooseModel = entities[entityName] = discriminator ? entities[discriminator].discriminator(name, mongooseSchema) : mongoose.model(name, mongooseSchema, name)

    // also discriminate and extend access
    if (discriminator || extend) {
      pleasureEntityMap[entityName].access = merge(pleasureEntityMap[discriminator || extend].access || {}, access || {})
      // console.log(`extending access`, pleasureEntityMap[entityName].access)
    }

    initFns.push(entities => {
      /**
       * Called when the mongoose model is created from a {@link Entity}
       *
       * @event Entity#modelCreated
       * @type Object
       * @property {Object} model - mongoose model
       * @property {PleasureEntityMap} entities - Pleasure entities
       */
      model.modelCreated && model.modelCreated({ mongooseModel, entities })
      emit('model-created', { model: mongooseModel, entities })
    })

    return mongooseModel
  }

  Object.keys(pleasureEntityMap).filter(entityName => {
    if (pleasureEntityMap[entityName].discriminator) {
      discriminated.push(entityName)
    } else if (pleasureEntityMap[entityName].extend) {
      extended.push(entityName)
    }
    return !pleasureEntityMap[entityName].extend && !pleasureEntityMap[entityName].discriminator
  })
    .forEach(createSchema)

  exhaust(extended, createSchema)
  exhaust(discriminated, createSchema)

  initFns.forEach(fn => {
    fn(entities)
  })

  emit('pleasure-entity-map', pleasureEntityMap)

  return { entities, schemas: pleasureEntityMap }
}
