import { initializeEntities } from './initialize-entities.js'

let entities = null
let schemas = null
let initializing
const finish = []

/**
 * @function getEntities
 * @static
 * @memberOf API
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
    return new Promise((resolve) => {
      finish.push(resolve)
    })
  }

  initializing = true
  const { entities: theEntities, schemas: theSchemas } = await initializeEntities()
  entities = theEntities
  schemas = theSchemas

  finish.forEach(resolve => resolve({ entities, schemas }))

  return { entities, schemas }
}
