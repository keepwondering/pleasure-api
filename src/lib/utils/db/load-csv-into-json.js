import csv from 'csvtojson/v1'
import path from 'path'
import Promise from 'bluebird'
import { asteriskToBoolean } from './asterisk-to-boolean'
// import { resolveFilesToUploads } from './resolve-files-to-uploads'
import concat from 'lodash/concat'
import omit from 'lodash/omit'

const resolveCSV = (csvFile) => {
  return path.resolve(__dirname, '../../scripts/init-data', csvFile)
}

const plugins = [asteriskToBoolean/*, resolveFilesToUploads*/]

function process (jsonObj, plugin) {
  return Promise
    .resolve(plugin ? concat(plugins, plugin) : plugins)
    .each(async plugin => {
      // console.log({plugin})
      jsonObj = await plugin(jsonObj)
    })
    .then(() => jsonObj)
}

/**
 * @method loadCSVIntoJSON
 * @param csvFile
 * @param {Object} opts - Some extra options for csvtojson. {@see https://github.com/Keyang/node-csvtojson}
 * @param {RegExp} opts.includeColumns - Include only columns matching the regular expression. {@see https://github.com/Keyang/node-csvtojson}
 * @param {Boolean} opts.ignoreEmpty - Whether to ignore empty values in csv columns. {@see https://github.com/Keyang/node-csvtojson}
 * @param {Function} opts.plugin - Function that receives each entry as the first argument. Must return back the entry.
 * @return {Promise<void>}
 */
export async function loadCSVIntoJSON (csvFile, opts) {
  const { plugin } = opts || {}

  return new Promise((resolve, reject) => {
    const values = []

    csv(omit(opts, 'plugin'))
      .fromFile(resolveCSV(csvFile))
      .on('json', (jsonObj) => {
        values.push(process(jsonObj, plugin))
      })
      .on('done', async () => {
        resolve(await Promise.all(values))
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}
