import { MongoBackup } from './mongo-backup'
import { getConfig } from 'pleasure-api'
import querystring from 'querystring'

import moment from 'moment'
import tar from 'tar'
import path from 'path'
// const { tmpFolder, uploadFolder } = require('../../server/utils/project-paths')
// import copydir from 'copy-dir'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

const pif = (w, what = null) => {
  return w ? what || w : ''
}

export function getMongoUri (credentials = {}) {
  // important: do not move to the global scope
  const { mongodb } = getConfig()

  const { username = mongodb.username, password = mongodb.password, host = mongodb.host, port = mongodb.port, database = mongodb.database } = credentials
  let { driverOptions = {} } = credentials

  return `mongodb://${pif(username)}${pif(password, ':' + password)}${pif(username, '@')}${host}:${port}/${database}?${querystring.stringify(driverOptions)}`
}

export async function backupDB ({ name, compress = true, verbose = true } = {}) {
  const { mongodb } = getConfig()
  // todo: implement plugins
  // const { tmpFolder, uploadFolder } = require('../../server/utils/project-paths')

  const autoName = `${mongodb.database}-${moment().format('YYYY-MM-DD-HH-mm-ss')}`
  const backUpName = name || autoName
  const backUpPath = path.join(process.cwd(), backUpName)

  mkdirp.sync(backUpPath)

  const mongoDBBackup = await new MongoBackup('mongodb', { basePath: backUpPath })
  await mongoDBBackup.backup()

  const file = backUpPath + `.${compress ? 'tgz' : 'tar'}`

  await tar.c(
    {
      file,
      cwd: backUpPath
    },
    ['./']
  )

  rimraf.sync(backUpPath)

  return { db: getMongoUri(), file }
}
