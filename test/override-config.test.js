import test from 'ava'
import { getConfig } from '../'

test(`Override config from ENV variables`, async t => {
  let { mongodb: { host } } = getConfig()
  t.is(host, 'localhost')
  process.env.PLEASURE_API_MONGODB_HOST = '127.0.0.1';
  ({ mongodb: { host } } = getConfig())
  t.is(host, '127.0.0.1')
})
