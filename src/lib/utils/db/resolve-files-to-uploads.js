import Promise from 'bluebird'
import _ from 'lodash'

// import { saveUploadedFile } from '../api/lib/save-uploaded-file'
const filePattern = /^@file:(.+)$/
const path = require('path')

export async function resolveFilesToUploads (obj) {
  // console.log('got', JSON.stringify(obj, null, 2))
  const saveAndGetId = async (file) => {
    // array of strings of uploads
    if (/^\[[\s]*@file:]$/.test(file)) {
      // console.log('loading array of files')
      const res = []
      _.trim(file, '[]').split(';').forEach(file => {
        res.push(saveAndGetId(file))
      })

      return Promise
        .all(res)
    }

    if (!filePattern.test(file)) {
      return file
    }

    const fileName = path.resolve(process.cwd(), file.match(filePattern)[1])
    const uploadedFile = await saveUploadedFile({
      file: {
        name: fileName
      },
      category: 'main',
      remoteIp: '127.0.0.1'
    })

    return uploadedFile._id
  }

  const saveAndReplacePropWithUploadedId = async (file, prop) => {
    _.set(obj, prop, await saveAndGetId(file))
  }

  const processing = []

  _.forOwn(obj, (file, prop) => {
    processing.push(saveAndReplacePropWithUploadedId(file, prop))
  })

  await Promise.all(processing)
  return obj
}
