import fs from 'fs'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import hash from 'object-hash'
import { findRoot } from 'pleasure-utils'
import sessionBlacklist from './session-blacklist.js'

// const { models: { sessionBlacklist: SessionBlacklist } } = getModels()
// const { appLogger } = require('./log')

let jwtCert
let jwtPub

let SessionBlacklist

export function init (config) {
  SessionBlacklist = sessionBlacklist()

  let { privateKey, publicKey } = config
  privateKey = findRoot(privateKey)
  publicKey = findRoot(publicKey)

  if (!fs.existsSync(privateKey) || !fs.existsSync(publicKey)) {
    console.error('Please generate server keys first.')
    process.exit(0)
  }

  jwtCert = fs.readFileSync(privateKey) // get private key
  jwtPub = fs.readFileSync(publicKey) // get private key
}

export function sign (what, cert) {
  return new Promise((resolve, reject) => {
    jwt.sign(what, cert || jwtCert, { algorithm: 'RS256' }, function (err, token) {
      if (err) {
        return reject(new Error(err))
      }

      resolve(token)
    })
  })
}

export async function issueToken (whatFor, expiration = c.SESSION_LENGTH, cert) {
  const sessionId = hash(whatFor)
  const created = Date.now()
  const expires = moment().add(...expiration).valueOf()
  const token = await sign(Object.assign({
    sessionId,
    created,
    expires
  }, whatFor), cert)
  // todo: change sessionId for id for next release

  return {
    token,
    sessionId,
    created,
    expires
  }
}

export function verify (token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtPub, function (err, decoded) {
      if (err) {
        return reject(new Error(err))
      }

      resolve(decoded)
    })
  })
}

export async function getValidToken (jwtToken) {
  let token
  try {
    token = await verify(jwtToken)
  } catch (err) {
    // shhh
  }

  if (!token || Date.now() >= token.expires) {
    return
  }

  return token
}

export async function isRevoked (sessionId) {
  const blacklist = await SessionBlacklist.findOne({ sessionId })
  return blacklist && moment().isAfter(moment(blacklist.expires))
}

export async function revoke ({ _id: userId, email, sessionId, sessionExpires }, inInterval = 0, intervalType = 'seconds') {
  const revoked = await SessionBlacklist.findOne({ sessionId })

  if (revoked || !sessionId) {
    return
  }

  try {
    await new SessionBlacklist({
      sessionId,
      expires: moment().add(inInterval, intervalType),
      sessionExpires
    }).save()
    /*
        appLogger.info({
          userId,
          email,
          sessionId
        }, `session revoked`)
    */
  } catch (err) {
    /*
        appLogger.error({
          userId,
          email,
          sessionId
        }, `session revoked`)
    */
  }
}
