import test from 'ava'
import _ from 'lodash'
import { expect } from 'chai'
import { PleasureApiClient } from 'pleasure-api-client' // pleasure
import { getConfig, getPleasureEntityMap, getPermissions, getEntities } from '../' // pleasure-api
import './utils/web-server.js'

let pleasureClient

test.before(() => {
  pleasureClient = PleasureApiClient.instance()
})

let dummyUser

const testEntities = ['order', 'product', 'provider', 'user']

// console.log({ pleasureClient })

process.on('dummy-user', du => dummyUser = du)

test.beforeEach(async t => {
  return pleasureClient.logout()
})

test(`Read PleasureEntity from config.api.entitiesPath`, async t => {
  const PleasureEntityMap = await getPleasureEntityMap()

  t.deepEqual(Object.keys(PleasureEntityMap).sort(), testEntities)

  // {PleasureEntity} duck-type validation of nested objects
  testEntities.forEach(entity => {
    t.true(PleasureEntityMap[entity].hasOwnProperty('model'))
    t.true(typeof PleasureEntityMap[entity].model === 'object')
    t.true(PleasureEntityMap[entity].model.hasOwnProperty('schema'))
    t.true(typeof PleasureEntityMap[entity].model.schema === 'object')

    if (entity !== 'provider') {
      // provider is a discriminator of user
      t.true(PleasureEntityMap[entity].model.hasOwnProperty('schemaCreated'))
    }
  })

  t.log(`Schemas loaded from ${ getConfig().entitiesPath }`)
})

test(`Initializes 'PleasureEntities' as mongodb collections`, async t => {
  const { entities } = await getEntities()

  t.deepEqual(Object.keys(entities).sort(), testEntities)

  t.log(`Entities loaded from ${ getConfig().entitiesPath }`)
})

/**
 * Extending an entity means using mongoose discriminators... but does it work for access too?
 */
test(`Extends entities model and controller`, async t => {
  const { schemas } = await getEntities()
  const { provider, user } = getPermissions(schemas)
  t.is(provider.create, user.create)
  // todo: verify what else extends... like does it extend the schema?
})

test(`Exposes entities via http`, async t => {
  // load schemas from api server
  const entities = await pleasureClient.list('schemas')

  t.deepEqual(Object.keys(entities).sort(), testEntities.filter(v => v !== 'order'))

  // iterating through entities
  _.forOwn(entities, (entity) => {
    t.true(typeof entity === 'object')

    // iterating through fields in entity
    _.forOwn(entity, (field, fieldName) => {
      // skipping virtuals
      if (_.get(field, 'options.options.virtual') || fieldName === '$pleasure') {
        return
      }

      // mongoose schema duck-type validation of nested object
      expect(field).to.have.property('path')
      expect(field).to.have.property('options')
      expect(field).to.have.property('instance')
    })
  })
})

test(`Retrieves models schemas filtered by auth user`, async t => {
  let entities = await pleasureClient.list('schemas')
  t.is(Object.keys(entities).length, 3)

  await pleasureClient.login({
    email: 'tin@devtin.io',
    password: 'aVeryStrongPassword123:)'
  })

  entities = await pleasureClient.list('schemas')
  t.is(Object.keys(entities).length, 4)
})
