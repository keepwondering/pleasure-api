import { getEntities } from '../../get-entities.js'
const Promise = require('bluebird')

export function dropDB () {
  return new Promise((resolve, reject) => {
    const { getMongoConnection, getMongoCredentials } = require('../../get-mongoose-connection.js')
    const credentials = getMongoCredentials()
    const connection = getMongoConnection()

    connection.on('connected', () => {
      connection.dropDatabase((err, res) => {
        if (err) {
          return reject(new Error(`Error dropping db: ${ err }`))
        }

        console.log(`Database ${ credentials.database } dropped!`)
        resolve()
      })
    })
  })
}

export async function emptyModels () {
  const { entities } = await getEntities()
  const process = []
  Object.keys(entities).forEach((entityName) => {
    process.push(entities[entityName])
  })
  return Promise
    .each(process, entity => entity.deleteMany({}))
    .catch(err => {
      console.log('remove error', err)
    })
}
