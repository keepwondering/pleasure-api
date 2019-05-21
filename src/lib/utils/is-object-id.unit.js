import test from 'ava'
import { isObjectId } from './is-object-id.js'

test(`ObjectId`, t => {
  t.false(isObjectId('papo'))
  t.false(isObjectId('microsoft123'))
  t.false(isObjectId(null))
  t.true(isObjectId('551137c2f9e1fac808a5f572'))
})
