import merge from 'deepmerge'
import pick from 'lodash/pick'
import moment from 'moment'

import { sign as jwtSign, revoke as jwtRevoke, verify as jwtVerify, isRevoked as jwtIsRevoked } from './jwt-token'
import hash from 'object-hash'

// const { appLogger } = require('./log')

export function setToken (ctx, { accessToken }) {
  if (ctx && ctx.session) {
    ctx.session.jwt = accessToken
  }
  return accessToken
}

export async function logout (ctx) {
  const { ip, state: { user } } = ctx

  ctx.session = null

  if (user) {
    const { email, sessionId, _id: userId } = user
    /*
    appLogger.info({
      userId,
      email,
      sessionId,
      ip
    }, `logged out :: ${ email }`)
*/
    await jwtRevoke(user)
  } else {
    // console.log('logout not user found')
  }

  delete ctx.state.user
}

export async function isValidSession (token) {
  let user
  try {
    user = await jwtVerify(token)
  } catch (err) {
    return false
  }

  return !(!user || user.expires <= Date.now() || await jwtIsRevoked(user.sessionId))
}

export async function login (user, { sessionExpires, ctx, mobile = false } = {}) {
  // determines the length of the session whether is a mobile session or a desktop session
  const sessionLength = mobile ? c.MOBILE_SESSION_LENGTH : c.SESSION_LENGTH
  sessionExpires = sessionExpires || moment().add(...sessionLength).valueOf()
  let ip = `127.0.0.1`

  const userSession = merge(pick(user, ['_id', 'firstName', 'lastName', 'email', 'level', 'created']), {
    sessionExpires
  })

  // object-hash for some reason is having troubles encoding the ObjectId
  userSession._id = userSession._id.toString()

  if (mobile) {
    userSession.mobile = true
  }

  // console.log({ userSession })
  const sessionId = hash(userSession, { ignoreUnknown: true })
  const renewToken = await jwtSign(sessionId)

  const accessToken = await jwtSign(merge(userSession, { sessionId }))

  if (accessToken.length > 4096) {
    // appLogger.error(`Resulted token can't be stored as a cookie since it exceeds the limit of 4096 bytes (current size: ${ accessToken.length } bytes)`)
  }

  const rawJwtToken = {
    userAgent: ctx.userAgent.source,
    sessionId,
    sessionExpires
  }

  const jwtToken = mobile ? Object.assign(rawJwtToken, { mobile }) : rawJwtToken

  user.jwtSessions.push(jwtToken)
  await user.save()

  if (ctx) {
    // console.log('assigning to context', { accessToken, renewToken })
    setToken(ctx, { accessToken, sessionExpires })
    ctx.body = { accessToken, renewToken }
    ip = ctx.ip
  }

  /* appLogger.info({
    userId: user._id,
    email: user.email,
    sessionId,
    sessionExpires,
    ip
  }, `logged in :: ${ user.email }`) */

  return { accessToken, renewToken, sessionId }
}
