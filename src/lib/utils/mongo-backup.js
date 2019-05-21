import { getMongoConnection } from 'src/lib/get-mongoose-connection'
import path from 'path'
import mkdirp from 'mkdirp'
import moment from 'moment'
import Promise from 'bluebird'
import defaults from 'lodash/defaults'
import padStart from 'lodash/padStart'
import fs from 'fs'

const writeFile = Promise.promisify(fs.writeFile)

const defaultOptions = {
  savedDocsCountLength: 10,
  docsChunkLength: 1024 * 1024// 1MB chunks
}

export class MongoBackup {
  constructor (backupName, options = {}) {
    backupName = backupName || `backup-${moment().format()}`
    const { basePath } = options
    const backupsBasePath = basePath || process.cwd()

    this.options = defaults(options, defaultOptions)

    this.backupPath = path.join(backupsBasePath, backupName)
    mkdirp.sync(this.backupPath)

    this.conn = null
    this.collections = []

    this._collectionsCreated = {}

    return new Promise((resolve) => {
      getMongoConnection().then((conn) => {
        this.conn = conn
        resolve(this)
      })
    })
  }

  static get defaultOptions () {
    return defaultOptions
  }

  static encodeDoc (doc) {
    // return mongooseDoc.toObject()
    return doc
  }

  collectionCreated (collectionName) {
    return this._collectionsCreated.hasOwnProperty(collectionName)
  }

  createCollection (collection) {
    if (!this.collectionCreated(collection)) {
      mkdirp.sync(path.join(this.backupPath, collection))
      this._collectionsCreated[collection] = { docs: [], sets: 0 }
    }
  }

  async dump (collection) {
    if (!this.collectionCreated(collection)) {
      return
    }

    const docs = this._collectionsCreated[collection].docs.map(MongoBackup.encodeDoc)

    if (docs.length === 0) {
      return
    }

    const setFilePath = path.join(this.backupPath, collection, padStart(this._collectionsCreated[collection].sets, this.options.savedDocsCountLength, '0') + '.json')
    await writeFile(setFilePath, JSON.stringify(docs))

    this._collectionsCreated[collection].sets++
    this._collectionsCreated[collection].docs = []
  }

  async saveDoc (collection, doc) {
    this.createCollection(collection)

    this._collectionsCreated[collection].docs.push(doc)
    const save = JSON.stringify(this._collectionsCreated[collection].docs)

    if (save.length >= this.options.docsChunkLength) {
      const docBiggerThanLength = JSON.stringify(doc).length > this.options.docsChunkLength

      if (docBiggerThanLength && this._collectionsCreated[collection].docs.length > 1) {
        this._collectionsCreated[collection].docs.pop()
      }

      await this.dump(collection)

      if (docBiggerThanLength && this._collectionsCreated[collection].docs.length > 1) {
        return this.saveDoc(collection, doc)
      }
    }
  }

  async backupCollection (name) {
    const cursor = this.conn.collection(name).find()
    while (await cursor.hasNext()) {
      await this.saveDoc(name, await cursor.next())
    }
    await this.dump(name)
  }

  async backup () {
    this.collections = await this.conn.db.listCollections().toArray().map(v => {
      return v.name
    })

    await Promise.each(this.collections, this.backupCollection.bind(this))
  }
}
