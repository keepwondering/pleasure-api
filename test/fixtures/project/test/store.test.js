import test from 'ava'
import './tools/web-server.js'
import { pleasureClient } from '../../../' // pleasure
import _ from 'lodash'

let dummyUser

const sampleUser = {
  fullName: 'Ana Sosa',
  email: 'acsosa@gmail.com',
  password: 'yellow123:)'
}

const sampleUser2 = {
  fullName: 'Etsbe González',
  email: 'etsber@gmail.com',
  password: 'yellow123:)'
}

const adminLogin = async () => {
  return pleasureClient.login({
    email: 'tin@devtin.io',
    password: 'aVeryStrongPassword123:)'
  })
}

process.on('dummy-user', du => dummyUser = du)

test.beforeEach(async t => {
  return pleasureClient.logout()
})

test(`Only admins can list product`, async t => {
  const listOrders = pleasureClient.list.bind(pleasureClient, 'order')
  await t.throwsAsync(listOrders)

  await adminLogin()

  await t.notThrowsAsync(listOrders)
})

test(`Only admins can create products`, async t => {
  const sampleProduct = {
    name: 'Mandoca con queso',
    description: 'Delicious deep-fried dumplings made out of corn flour and sweet plantain, filled with cheese.',
    categories: ['food', 'fast-food'],
    price: 3.99,
    stock: 60
  }

  await t.throwsAsync(() => {
    return pleasureClient.create('product', sampleProduct)
  })

  await adminLogin()

  await t.notThrowsAsync(async () => {
    const product = await pleasureClient.create('product', sampleProduct)
    t.is(product.name, sampleProduct.name)
  })
})

test(`Users can create orders`, async t => {
  const buy = {
    name: 'Mandoca con queso',
    description: 'Delicious deep-fried dumplings made out of corn flour and sweet plantain, filled with cheese.',
    categories: ['food', 'fast-food'],
    price: 3.99,
    quantity: 3
  }

  const createOrder = () => {
    return pleasureClient.create('order', {
      products: [buy]
    })
  }

  await t.throwsAsync(createOrder)
  t.log(`Unauthenticated user can not create orders.`)

  await pleasureClient.create('user', sampleUser)

  await pleasureClient.login({
    email: sampleUser.email,
    password: sampleUser.password
  })

  await t.notThrowsAsync(async () => {
    const order = await createOrder()
    t.truthy(order)
  })
})

test(`Users can only list their own orders`, async t => {
  await pleasureClient.create('user', sampleUser)
  await pleasureClient.create('user', sampleUser2)

  await pleasureClient.login(_.pick(sampleUser, ['email', 'password']))
  await pleasureClient.create('order', {
    products: [
      {
        name: `Norwegian Eggs Benedict`,
        description: `Served on top of a slice of green apple with smoked salmon and Hollandaise sauce`,
        price: 13.99
      },
      {
        name: `Freshly squeezed orange juice`,
        price: 4.99
      }
    ]
  })

  const orders = await pleasureClient.list('order')
  t.is(orders.length, 1)

  await pleasureClient.logout()

  await pleasureClient.login(_.pick(sampleUser2, ['email', 'password']))

  const orders2 = await pleasureClient.list('order')
  t.is(orders2.length, 0)

  await adminLogin()

  const orders3 = await pleasureClient.list('order')
  t.is(orders3.length, 1)

  t.log(`Admins can access all orders!`)
})

test(`Only admins can list users`, async t => {
  await pleasureClient.create('user', sampleUser)
  await pleasureClient.create('user', sampleUser2)

  const listUsers = () => {
    return pleasureClient.list('user')
  }

  await t.throwsAsync(listUsers)

  await pleasureClient.login(_.pick(sampleUser, ['email', 'password']))

  await t.throwsAsync(listUsers)

  await pleasureClient.login(_.pick(sampleUser2, ['email', 'password']))

  await t.throwsAsync(listUsers)

  await adminLogin()

  await t.notThrowsAsync(listUsers)
})
