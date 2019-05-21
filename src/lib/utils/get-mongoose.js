import { getMongoConnection } from 'src/lib/get-mongoose-connection'

let currentConnection = null

export function getMongoose () {
  if (currentConnection) {
    return currentConnection
  }

  currentConnection = getMongoConnection()

  return currentConnection
}
