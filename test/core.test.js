import test from 'ava'
import { expect } from 'chai'
import { PleasureApiClient } from 'pleasure-api-client'
import './utils/web-server.js'
import 'pleasure-core-dev-tools/test/clean-db-per-test.js'

const pleasureApiClient = PleasureApiClient.instance()

let dummyUser

process.on('dummy-user', du => dummyUser = du)

test.beforeEach(async t => {
  return pleasureApiClient.logout()
})

/**
 * Creates a dummy Kombucha product
 * @return {Promise<products>}
 */
const kombuchaForLife = async () => {
  // Given the dummy project configuration,
  // only admins can create entries in the products entity.
  // Hence...
  await pleasureApiClient.login({
    email: 'tin@devtin.io',
    password: 'aVeryStrongPassword123:)'
  })

  return pleasureApiClient.create(`product`, {
    name: 'Gingerade Kombucha',
    price: 1.99,
    stock: 3,
    categories: ['beverages', 'fitness', 'health']
  })
}

/**
 * Creates a dummy Banana product
 * @return {Promise<products>}
 */
const bananaForLife = async () => {
  // Given the dummy project configuration,
  // only admins can create entries in the products entity.
  // Hence...
  await pleasureApiClient.login({
    email: 'tin@devtin.io',
    password: 'aVeryStrongPassword123:)'
  })

  return pleasureApiClient.create(`product`, {
    name: 'Banana',
    price: 0.25,
    stock: 12,
    categories: ['food', 'health']
  })
}
test(`Creates entries`, async t => {
  const entry = await pleasureApiClient.create(`user`, {
    fullName: `Ana Sosa`,
    email: 'acsosa@gmail.com',
    password: 'anotherStrongPassword'
  })

  t.truthy(entry)
  t.is('acsosa@gmail.com', entry.email)
})

test(`Reads entries by id from entities`, async t => {
  const entry = await pleasureApiClient.read(`user`, dummyUser._id)
  t.truthy(entry)
  t.is(dummyUser.email, entry.email)
})

test(`Updates entries by id`, async t => {
  const newFullName = 'Olivia'
  const entry = await pleasureApiClient.update(`user`, dummyUser._id, {
    fullName: newFullName
  })

  t.truthy(entry)

  t.is(entry._id, dummyUser.id.toString())
  t.is(entry.email, dummyUser.email)
  t.not(entry.fullName, dummyUser.fullName)
  t.is(entry.fullName, newFullName)
})

test(`Deletes entries by id`, async t => {
  const entry = await pleasureApiClient.create(`user`, {
    fullName: `Ana Sosa`,
    email: 'acsosa@gmail.com',
    password: 'anotherStrongPassword'
  })

  t.truthy(entry)
  t.is('acsosa@gmail.com', entry.email)

  await t.notThrowsAsync(() => {
    return pleasureApiClient.delete(`user`, entry._id)
  })

  await t.throwsAsync(() => {
    return pleasureApiClient.read(`user`, entry._id)
  }, '404') // not found
})

test(`Deletes multiple entries by query`, async t => {
  const entry = await pleasureApiClient.create(`user`, {
    fullName: `Ana Sosa`,
    email: 'acsosa@gmail.com',
    password: 'anotherStrongPassword'
  })

  t.truthy(entry)
  t.is('acsosa@gmail.com', entry.email)

  await t.notThrowsAsync(() => {
    return pleasureApiClient.delete(`user`, { email: 'acsosa@gmail.com' })
  })

  await t.throwsAsync(() => {
    return pleasureApiClient.read(`user`, entry._id)
  }, '404') // not found
})

test(`Deletes multiple entries by complex queries (regex)`, async t => {
  const entry = await pleasureApiClient.create(`user`, {
    fullName: `Ana Sosa`,
    email: 'acsosa@gmail.com',
    password: 'anotherStrongPassword'
  })

  t.truthy(entry)
  t.is('acsosa@gmail.com', entry.email)

  await t.notThrowsAsync(() => {
    return pleasureApiClient.delete(`user`, { email: /@gmail.com$/i })
  })

  await t.throwsAsync(() => {
    return pleasureApiClient.read(`user`, entry._id)
  }, '404') // not found
})

test(`Deletes multiple entries at once, by id`, async t => {
  const entry1 = await pleasureApiClient.create(`user`, {
    fullName: `Ana Sosa`,
    email: 'acsosa@gmail.com',
    password: 'anotherStrongPassword'
  })

  const entry2 = await pleasureApiClient.create(`user`, {
    fullName: `Etsbe González`,
    email: 'etsber@gmail.com',
    password: 'anotherStrongPassword'
  })

  t.truthy(entry1)
  t.truthy(entry2)
  t.is('acsosa@gmail.com', entry1.email)
  t.is('etsber@gmail.com', entry2.email)

  await t.notThrowsAsync(() => {
    return pleasureApiClient.delete(`user`, [entry1._id, entry2._id])
  })

  await t.throwsAsync(() => {
    return pleasureApiClient.read(`user`, entry1._id)
  }, '404') // not found

  await t.throwsAsync(() => {
    return pleasureApiClient.read(`user`, entry2._id)
  }, '404') // not found
})

test(`Lists entries in entities`, async t => {
  const entries = await pleasureApiClient.list(`product`)
  t.truthy(entries)
  t.true(Array.isArray(entries))
  t.true(entries.length > 0)
})

// todo: implement 'sort' access method to return the fields a user can use to sort the db
//  make this field be by default the entities index paths
test(`Lists entities sorted by entry's properties descending or ascending`, async t => {
  await kombuchaForLife() // add another product

  const productsAscending = (await pleasureApiClient.list(`product`, { sort: { name: 1 } })).map(({ _id }) => _id)
  const productsDescending = (await pleasureApiClient.list(`product`, { sort: { name: -1 } })).map(({ _id }) => _id)

  t.true(productsAscending.length > 1) // at least two products in db
  t.deepEqual(productsAscending, productsDescending.reverse())
})

test(`Lists entities filtered by full text search`, async t => {
  await kombuchaForLife()
  const products = await pleasureApiClient.list('product')
  const productsSearch = await pleasureApiClient.list('product', { search: `"gingerade kombucha"` })
  t.true(products.length === 2)
  t.true(productsSearch.length === 1)
})

test(`Lists entities pagination and limit`, async t => {
  await kombuchaForLife()
  const products = await pleasureApiClient.list('product')
  const productSkip = await pleasureApiClient.list('product', { skip: 1 })
  const productLimit = await pleasureApiClient.list('product', { limit: 1 })
  t.true(products.length === 2)
  t.true(productSkip.length === 1)
  t.true(productLimit.length === 1)
  t.truthy(productSkip[0]._id)
  t.truthy(productLimit[0]._id)
  t.not(productSkip[0]._id, productLimit[0]._id)
})

test(`Lists entities filtered by fields comparison`, async t => {
  await kombuchaForLife()
  await bananaForLife()

  const beverageProducts = await pleasureApiClient.list('product', { find: { categories: { $all: ['beverages'] } } })
  const fitnessProducts = await pleasureApiClient.list('product', { find: { categories: { $all: ['fitness'] } } })
  const foodProducts = await pleasureApiClient.list('product', { find: { categories: { $all: ['food'] } } })

  t.true(beverageProducts.length === 2)
  t.true(fitnessProducts.length === 1)
  t.true(foodProducts.length === 1)
})

test(`Pushes docs into entry's arrays`, async t => {
  const { _id: kombucha } = await kombuchaForLife()

  const readKombucha = () => {
    return pleasureApiClient.read(`product`, kombucha)
  }

  t.deepEqual((await readKombucha()).categories, ['beverages', 'fitness', 'health'])

  await t.notThrowsAsync(() => pleasureApiClient.push(`product`, kombucha, 'categories', 'gut'))

  t.deepEqual((await readKombucha()).categories, ['beverages', 'fitness', 'health', 'gut'])
})

test(`Pushes complex objects into entry's arrays`, async t => {
  await pleasureApiClient.login({
    email: 'tin@devtin.io',
    password: 'aVeryStrongPassword123:)'
  })

  const buy = {
    name: 'Mandoca con queso',
    description: 'Delicious deep-fried dumplings made out of corn flour and sweet plantain, filled with cheese.',
    categories: ['food', 'fast-food'],
    price: 3.99,
    quantity: 3
  }

  const buy2 = {
    name: 'Reeses',
    description: 'Delicious peanut butter chocolate.',
    categories: ['food', 'fast-food'],
    price: 2.99,
    quantity: 2
  }

  const createdOrder = await pleasureApiClient.create('order', {
    products: [buy]
  })

  t.true(Array.isArray(createdOrder.products))
  t.is(createdOrder.products.length, 1)

  await t.notThrowsAsync(() => pleasureApiClient.push('order', createdOrder._id, 'products', buy2))

  const newOrder = await pleasureApiClient.read('order', createdOrder._id)

  t.truthy(newOrder)
  t.is(newOrder.products.length, 2)
})

test(`Pushes multiple docs into entry's arrays`, async t => {
  const { _id: kombucha } = await kombuchaForLife()

  const readKombucha = () => {
    return pleasureApiClient.read(`product`, kombucha)
  }

  t.deepEqual((await readKombucha()).categories, ['beverages', 'fitness', 'health'])

  await t.notThrowsAsync(() => pleasureApiClient.push(`product`, kombucha, 'categories', ['gut', 'tea'], true))

  t.deepEqual((await readKombucha()).categories, ['beverages', 'fitness', 'health', 'gut', 'tea'])
})

test(`Pulls docs out of entry's arrays`, async t => {
  const { _id: kombucha, categories: initialCategories } = await kombuchaForLife()

  t.deepEqual(initialCategories, ['beverages', 'fitness', 'health'])

  const { categories } = await pleasureApiClient.pull(`product`, kombucha, 'categories', 'fitness')

  t.deepEqual(categories, ['beverages', 'health'])
})

test(`Pulls multiple docs out of an entry's array.`, async t => {
  const { _id: kombucha, categories: initialCategories } = await kombuchaForLife()

  t.deepEqual(initialCategories, ['beverages', 'fitness', 'health'])

  const { categories } = await pleasureApiClient.pull(`product`, kombucha, 'categories', ['fitness', 'beverages'])

  t.deepEqual(categories, ['health'])
})
