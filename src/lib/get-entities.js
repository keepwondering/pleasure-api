import { initializeEntities } from './initialize-entities.js'
import { getConfig } from './get-config'

let entities = null
let schemas = null
let initializing
const finish = []
const rejects = []

/**
 * @method API.getEntities
 * @summary Looks & initializes (if not initialized already) all entities found in the path `entitiesPath` located in {@link API.ApiConfig}
 * @desc Lists all `*.js` files found in {@link API.ApiConfig}`->entitiesPath` and initializes their respective mongoose
 * models.
 *
 * @return {Promise<{ schemas, entities }>} An object containing all {@link Entity Entities} and their respective
 * schemas found in the project.
 */
export async function getEntities () {
  if (entities) {
    return { entities, schemas }
  }

  if (initializing) {
    return new Promise((resolve, reject) => {
      rejects.push(reject)
      finish.push(resolve)
    })
  }

  const { createEntityTimeout } = getConfig()

  initializing = true
  const toC = setTimeout(() => {
    rejects.forEach(r => r(new Error(`Entity creation timeout.`)))
  }, createEntityTimeout)

  const { entities: theEntities, schemas: theSchemas } = await initializeEntities() //todo: check why not resolving
  entities = theEntities
  schemas = theSchemas

  clearTimeout(toC)

  finish.forEach(resolve => resolve({ entities, schemas }))

  return { entities, schemas }
}
