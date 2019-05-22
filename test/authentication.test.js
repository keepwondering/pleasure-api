import test from 'ava'
import { PleasureApiClient } from 'pleasure-api-client'
import './utils/web-server.js'
import 'pleasure-core-dev-tools/test/clean-db-per-test.js'

const pleasureApiClient = PleasureApiClient.instance()

test(`Retrieves access token and refresh token via credentials`, async t => {
  const { accessToken, refreshToken } = await pleasureApiClient.login({
    email: 'tin@devtin.io',
    password: 'aVeryStrongPassword123:)'
  })

  await pleasureApiClient.logout()

  t.truthy(accessToken)
  t.truthy(refreshToken)
})

test(`Throws an error given invalid credentials`, async t => {
  await t.throwsAsync(() => {
    return pleasureApiClient.login({
      email: 'tin@devtin.io',
      password: 'invalidPassword'
    })
  }, Error, 'error.invalid-credentials')
})

test.todo(`Throws an error given an invalid JWT token`)

test.todo(`Handle errors`)
test.todo(`Handle multiple errors`)
test.todo(`Receives static mongoose model method to perform login`)
test.todo(`Login using static method`)
