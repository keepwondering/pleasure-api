import moment from './jwt-token'

async function removeExpiredTokens () {
  return SessionBlacklist.deleteMany({ sessionExpires: { $lt: new Date() } })
}

async function autoRemoveExpiredTokens () {
  try {
    const { n: sessionsRemoved } = await removeExpiredTokens()
    if (sessionsRemoved > 0) {
      appLogger.info({ sessionsRemoved }, `auto session removal`)
    }
  } catch (err) {
    appLogger.error({ err }, `auto session removal`)
  }
}

autoRemoveExpiredTokens()
setInterval(autoRemoveExpiredTokens, moment.duration(...c.REMOVE_EXPIRED_JWT_TOKENS_EVERY))
