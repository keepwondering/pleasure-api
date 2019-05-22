import test from 'ava'
import { expect } from 'chai'
import { PleasureApiClient } from 'pleasure-api-client'
import 'pleasure-core-dev-tools/test/clean-db-per-test.js'
import './utils/web-server.js'
import { adminLogin } from 'pleasure-core-dev-tools/test/admin-login.js'

const pleasureClient = PleasureApiClient.instance()

let dummyUser

process.on('dummy-user', du => dummyUser = du)

test.beforeEach(async t => {
  return pleasureClient.logout()
})

const waitForEvent = (obj, event, wait = 3000, err = new Error(`time-out ${ event }`)) => {
  return new Promise((resolve, reject) => {
    obj.on(event, function (payload) {
      setTimeout(() => {
        resolve(payload)
      }, 30) // wait for api to return data to client
    })
    setTimeout(reject.bind(null, err), wait)
  })
}

const waitForSocketConnection = () => {
  pleasureClient.connect()
  return waitForEvent(pleasureClient, 'connect')
}

test(`Socket.io connects`, async t => {
  pleasureClient.connect() // in order to trigger the connect event since this would have been called long ago
  await t.notThrowsAsync(waitForEvent(pleasureClient, 'connect'))
})

test(`Informs when creating an entry in an entity`, async t => {
  await adminLogin()

  await waitForSocketConnection()
  const newProduct = {
    name: 'Un producto'
  }
  let createdProduct

  setTimeout(async () => {
    createdProduct = await pleasureClient.create('product', newProduct)
  }, 5)

  await t.notThrowsAsync(async () => {
    const payload = await waitForEvent(pleasureClient, 'create')
    t.truthy(payload)
    t.is(payload.entry._id, createdProduct._id)
  })
})

test(`Informs when updating an entry from an entity`, async t => {
  await adminLogin()

  await waitForSocketConnection()
  const newProduct = {
    name: 'Un producto'
  }

  const product = await pleasureClient.product.create(newProduct)

  setTimeout(() => {
    pleasureClient.update('product', product._id, {
      name: 'Nuevo nombre'
    })
  }, 5)
  await t.notThrowsAsync(async () => {
    const payload = await waitForEvent(pleasureClient, 'update')
    t.truthy(payload)
    t.is(payload.entry._id, product._id)
  })
})

test(`Informs when deleting an entry from an entity`, async t => {
  await adminLogin()

  await waitForSocketConnection()
  const newProduct = {
    name: 'Un producto'
  }

  const product = await pleasureClient.create('product', newProduct)
  let deleted

  setTimeout(async () => {
    deleted = await pleasureClient.delete('product', { _id: product._id })
  }, 5)

  await t.notThrowsAsync(async () => {
    const payload = await waitForEvent(pleasureClient, 'delete')
    t.truthy(payload)
    t.is(product._id, payload.entry._id)
  })
})

test(`Delete event hook per entry.`, async t => {
  const productToDelete = (await pleasureClient.product.list())[0]
  let deletedProduct

  t.truthy(productToDelete)

  await t.notThrowsAsync(adminLogin)

  setTimeout(async () => {
    deletedProduct = await pleasureClient.product.delete(productToDelete._id)
  }, 5)

  await t.notThrowsAsync(async () => {
    const productScope = pleasureClient.product(productToDelete._id)
    const payload = await waitForEvent(productScope, 'delete')

    t.truthy(payload)
    t.is(payload._id, deletedProduct._id)
  })
})

test(`Update event hook per entry.`, async t => {
  const productToUpdate = (await pleasureClient.product.list())[0]
  let updatedProduct

  t.truthy(productToUpdate)

  await adminLogin()

  setTimeout(async () => {
    updatedProduct = await pleasureClient.product(productToUpdate._id).update({
      name: 'New product name'
    })
  }, 5)

  await t.notThrowsAsync(async () => {
    const productScope = pleasureClient.product(productToUpdate._id)
    const payload = await waitForEvent(productScope, 'update')

    t.truthy(payload)
    t.truthy(updatedProduct)
    t.is(payload._id, productToUpdate._id)
    t.is(updatedProduct.name, 'New product name')
  })
})

test(`Socket.io payload can be customized from entities config file.`, async t => {
  await adminLogin()

  await waitForSocketConnection()
  const newProduct = {
    name: 'Un producto'
  }

  setTimeout(() => {
    pleasureClient.create('product', newProduct)
  }, 5)

  await t.notThrowsAsync(async () => {
    const payload = await waitForEvent(pleasureClient, 'create')
    t.truthy(payload)
    t.is(payload.entry.name, newProduct.name)
  })
})

test(`Socket.io delivery access can be customized from entities config file.`, async t => {
  await waitForSocketConnection()
  const newUser = {
    fullName: 'Jesús Márquez',
    email: 'wesmarquez@hotmail.com',
    password: 'wesmarquez123'
  }

  let newCreatedUser

  setTimeout(async () => {
    newCreatedUser = await pleasureClient.create('user', newUser)
  }, 5)

  await t.throwsAsync(async () => {
    return waitForEvent(pleasureClient, 'create', 500)
  })

  await adminLogin()
  await waitForSocketConnection()

  t.truthy(newCreatedUser)
  await pleasureClient.user(newCreatedUser._id).delete()

  setTimeout(() => {
    return t.notThrowsAsync(() => {
      return pleasureClient.create('user', newUser)
    })
  }, 5)

  await t.notThrowsAsync(async () => {
    return waitForEvent(pleasureClient, 'create', 500, new Error(``))
  })
})
