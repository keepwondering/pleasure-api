import test from 'ava'
import { expect } from 'chai'
import { PleasureApiClient } from 'pleasure-api-client' // pleasure
import './utils/web-server.js'
import 'pleasure-core-dev-tools/test/clean-db-per-test.js'
import { pick } from 'lodash'

const pleasureClient = PleasureApiClient.instance()

test.beforeEach(async t => {
  return pleasureClient.logout()
})

const newDummyUser = {
  fullName: 'Etsbe González',
  password: 'labeba123',
  email: 'etsber@gmail.com'
}

test(`Syntax sugar for creating entries in entities.`, async t => {
  const user = await pleasureClient.user.create(newDummyUser)

  t.truthy(user)
  t.is(user.email, newDummyUser.email)
})

test(`Syntax sugar for removing entries from entities.`, async t => {
  const login = () => {
    return pleasureClient.login(pick(newDummyUser, ['email', 'password']))
  }

  const user = await pleasureClient.user.create(newDummyUser)

  await t.notThrowsAsync(login)

  // sugar for: await pleasureClient.user.delete(user._id)
  const removedUser = await pleasureClient.user(user._id).delete()

  t.is(removedUser._id, user._id)
  await t.throwsAsync(login)
})

test(`Syntax sugar for updating entries from entities.`, async t => {
  const login = (altPassword) => {
    return pleasureClient.login({
      email: 'etsber@gmail.com',
      password: altPassword || 'labeba123'
    })
  }

  const user = await pleasureClient.user.create(newDummyUser)

  await t.notThrowsAsync(login)

  // same as: pleasureClient.use(user._id).update({...})
  await pleasureClient.user.update(user._id, {
    password: 'newPassword123'
  })

  await pleasureClient.logout()

  await t.throwsAsync(login)
  await t.notThrowsAsync(login.bind(null, 'newPassword123'))
})

test(`Syntax sugar for accessing entities controllers.`, async t => {
  const products = await pleasureClient.product.oliviasFavorite()
  t.truthy(products)
  t.is(products[0].name, 'Kombucha')
})
