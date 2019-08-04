import test from 'ava'
import { PleasureApiClient } from 'pleasure-api-client'
import { getPermissions, getEntities } from '../' // pleasure-api
// import { api, PleasureClient } from '../../'
import './utils/web-server.js'
import 'pleasure-core-dev-tools/test/clean-db-per-test.js'
import _ from 'lodash'

const pleasureClient = PleasureApiClient.instance()
// const { getPermissions } = api.plugins.authorization

let dummyUser

process.on('dummy-user', du => dummyUser = du)

test.beforeEach(async t => {
  return pleasureClient.logout()
})

test(`Reads local permissions`, async t => {
  const { schemas } = await getEntities()
  t.truthy(schemas)
  const permissions = await getPermissions(schemas)
  t.truthy(permissions)
  t.true(typeof permissions === 'object')
  t.truthy(permissions.product)
  t.truthy(permissions.user)
})

test(`Restrict access to entities by permissions`, async t => {
  const newProduct = {
    name: `Cabernet Sauvignon`,
    description: `Delicious wine from selected area of California.`,
    stock: 12,
    price: 5.99,
    categories: ['beverages', 'alcohol']
  }

  await t.throwsAsync(() => {
    return pleasureClient.create(`product`, newProduct)
  }, 'Method not implemented')

  await t.throwsAsync(() => {
    return pleasureClient.list(`user`)
  }, 'Method not implemented')

  await pleasureClient.login({
    email: 'tin@devtin.io',
    password: 'aVeryStrongPassword123:)'
  })

  await t.notThrowsAsync(() => {
    return pleasureClient.list(`user`)
  })

  let products

  await t.notThrowsAsync(() => {
    return pleasureClient.create(`product`, newProduct)
  })

  await t.notThrowsAsync(async () => {
    products = await pleasureClient.list(`product`)
  })

  t.truthy(products)
  t.true(Array.isArray(products))
  t.true(products.length === 2)
  t.deepEqual(_.omit(products[1], ['_id', '__v', 'id']), newProduct)
})
