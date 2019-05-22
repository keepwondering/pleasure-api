import test from 'ava'
import { expect } from 'chai'
import { PleasureApiClient } from 'pleasure-api-client' // pleasure
import './utils/web-server.js'
import 'pleasure-core-dev-tools/test/clean-db-per-test.js'
import { adminLogin } from 'pleasure-core-dev-tools/test/admin-login.js'

const pleasureClient = PleasureApiClient.instance()

test(`Router controller methods can be added to an entity`, async t => {
  await adminLogin()
  // see dummy/project/api/order > controller.new
  const products = await pleasureClient.product.list()

  const productCreated = await pleasureClient.order.create({
    products
  })

  const newOrders = await pleasureClient.controller('order', 'retrieveNew')
  t.truthy(newOrders)
  t.true(Array.isArray(newOrders))
  t.is(newOrders.length, 1)
  t.is(newOrders[0]._id, productCreated._id)

  const justAnArray = await pleasureClient.order.justAnArray()
  t.truthy(justAnArray)
  t.true(Array.isArray(justAnArray))
  t.is(justAnArray.length, 1)
  t.is(justAnArray[0], 'array')

  const justAString = await pleasureClient.order.justAString()
  t.truthy(justAString)
  t.true(typeof justAString === 'string')
  t.is(justAString, 'string')
})
