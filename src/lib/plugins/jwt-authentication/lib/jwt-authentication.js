import { getConfig } from 'lib/get-config'
import merge from 'lodash/merge'
import moment from 'moment'
import { sign } from './jwt-token.js'
import pick from 'lodash/pick'
import hash from 'object-hash'

export async function jwtSession (data, sessionExpires, sessionLength = []) {
  sessionExpires = sessionExpires || moment().add(...sessionLength).valueOf()

  const userSession = merge(data, {
    sessionExpires
  })

  const sessionId = hash(userSession, { ignoreUnknown: true })
  const refreshToken = await sign(sessionId)
  const accessToken = await sign(merge(userSession, { sessionId }))

  if (accessToken.length > 4096) {
    console.error(`Resulted token can't be stored as a cookie since it exceeds the limit of 4096 bytes (current size: ${accessToken.length} bytes)`)
  }

  return { accessToken, refreshToken, sessionId }
}

export async function signIn (sessionFields = [], sessionLength = [], user) {
  // object-hash for some reason is having troubles encoding the ObjectId
  if (user._id) {
    user._id = user._id.toString()
  }

  return pick(await jwtSession(pick(user, sessionFields)), ['accessToken', 'refreshToken'], sessionLength)
}
