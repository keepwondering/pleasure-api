const { getMongoConnection } = require('../../server/utils/get-mongoose-connection')
const path = require('path')
const Promise = require('bluebird')
const fs = require('fs')
const { Types: { ObjectId } } = require('mongoose')
const moment = require('moment')
const _ = require('lodash')

class MongooseBackupRestore {
  constructor (backupPath) {
    this.backupPath = backupPath
    this._collections = fs.readdirSync(this.backupPath).filter(MongooseBackupRestore.isCollection)
    this._collectionsInDb = []
    this._verbose = false

    return new Promise((resolve) => {
      getMongoConnection().then((conn) => {
        this.conn = conn
        // this.emit('')
        resolve(this)
        // this.restore()
      })
    })
  }

  static isCollection (fileName) {
    return /^[^.]/i.test(fileName)
  }

  static decodeDoc (doc) {
    doc = _.mapValues(doc, val => {
      if (typeof val === 'object' && !Array.isArray(val)) {
        return MongooseBackupRestore.decodeDoc(val)
      }

      if (moment(val, moment.ISO_8601, true).isValid()) {
        return new Date(val)
      }

      return val
    })

    if (doc._id) {
      doc._id = ObjectId(doc._id)
    }

    return doc
  }

  async collectionsExists () {
    this._collectionsInDb = await this.conn.db.listCollections().toArray().map(collection => {
      return collection.name
    })
    const existingCollections = _.intersection(this._collections, this._collectionsInDb)
    if (existingCollections.length > 0) {
      try {
        await Promise.each(existingCollections, async collection => {
          if (await this.conn.collection(collection).countDocuments() > 0) {
            throw new Error(`Collections has documents`)
          }
        })
      } catch (err) {
        return existingCollections
      }
    }
    return false
  }

  async removeExistingCollections () {
    const existingCollections = await this.collectionsExists()

    if (!existingCollections) {
      return
    }

    await Promise.each(existingCollections, async collection => {
      this.conn.db.dropCollection(collection)
    })
  }

  async restoreCollection (collectionName) {
    const dbFiles = fs.readdirSync(path.join(this.backupPath, collectionName)).filter(MongooseBackupRestore.isCollection)
    let records = 0
    let started = Date.now()
    dbFiles.sort()

    await Promise.each(dbFiles, async dbFile => {
      dbFile = path.join(this.backupPath, collectionName, dbFile)
      const dbArr = require(dbFile).map(MongooseBackupRestore.decodeDoc)

      await this.conn.collection(collectionName).insertMany(dbArr)
      records += dbArr.length
    })

    return { records, duration: Date.now() - started, files: dbFiles }
  }

  async restore () {
    await Promise.each(this._collections, async collection => {
      const { err, records, duration } = await this.restoreCollection(collection)
      !err && this._verbose && console.log(`Collection ${collection} restored ${records} records in ${Math.round(duration / 10) / 100}s`)
    })
  }
}

module.exports = MongooseBackupRestore
