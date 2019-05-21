import forOwn from 'lodash/forOwn'
import Promise from 'bluebird'
import { getMongoConnection } from 'src/lib/get-mongoose-connection'
import { getEntities } from 'src/lib/get-entities'
import deepmerge from 'deepmerge'

export function drop (credentials = {}) {
  return new Promise((resolve, reject) => {
    const connection = getMongoConnection(deepmerge({ driverOptions: { autoIndex: false } }, credentials))

    connection.on('connected', () => {
      connection.dropDatabase((err, res) => {
        if (err) {
          return reject(new Error(`Error dropping db: ${err}`))
        }

        // console.log(`Database ${ getMongoCredentials().database } dropped!`)
        resolve()
      })
    })
  })
}

export async function emptyModels () {
  const { entities } = await getEntities()

  const process = []

  forOwn(entities, (model, modelName) => {
    process.push(model)
  })

  return Promise
    .each(process, model => model.deleteMany({}))
    .catch(err => {
      console.log('Remove error', err)
    })
}
