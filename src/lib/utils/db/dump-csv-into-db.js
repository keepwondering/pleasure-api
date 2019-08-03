import { loadCSVIntoJSON } from './load-csv-into-json'
import { getEntities } from '../../get-entities.js'
import _ from 'lodash'
import chalk from 'chalk'
import Promise from 'bluebird'
import escapeRegexp from 'escape-string-regexp'

/**
 * @method dumpCSVIntoDB
 * @param {String} csvFile - The csv file
 * @param {String} entity - Entity where to load the entries
 * @param {Object} opts - Additional options
 * @param {Boolean} opts.info=true - Whether to print info messages
 * @param {Boolean} opts.debug=false - Whether to print debug messages
 * @param {Function|Promise} [opts.discriminator] - Optional function called with the entry being added as the only argument.
 * @param {String} [opts.duplicateCheck] - Field to look for duplicates
 * @param {Object} [opts.csv] - Options for {@link loadCSVIntoJSON}
 * @return {Promise<void>}
 */
export async function dumpCSVIntoDB (csvFile, entity, opts = {}) {
  opts = _.defaults(opts, { info: true, debug: false, csv: null })
  const { debug, info } = opts
  const { entities: models } = await getEntities()
  const Model = models[entity]

  if (!Model) {
    return
  }

  const dumping = await loadCSVIntoJSON(csvFile, opts.csv)
  // console.log({ dumping })
  const { discriminator, duplicateCheck } = opts
  let added = 0

  await Promise
    .all(dumping)
    .each(async (entry) => {
      if (discriminator && !await discriminator(entry)) {
        debug && console.log('dismissing', JSON.stringify(entry), `by discriminator`)
        return
      }

      entry = _.mapValues(entry, v => {
        try {
          v = JSON.parse(v)
        } catch (err) {
          debug && console.log({ err })
        }

        return v
      })

      if (duplicateCheck) {
        const find = new RegExp(`^${ escapeRegexp(_.get(entry, duplicateCheck).toLowerCase()) }$`, 'i')
        const findOne = { [duplicateCheck]: find }
        const existing = await Model.findOne(findOne)
        if (existing) {
          return info ? console.log(chalk.gray(`Refusing to add ${ _.get(entry, duplicateCheck) } in ${ entity }. [exists in ${ existing._id }]`)) : null
        }
      }

      try {
        await new Model(entry).save()
        debug && console.log('added...')
        added++
      } catch (err) {
        info && console.log(err)
        info && console.log(chalk.red(`import error: ${ err.message }`))
        info && console.log(chalk.red(JSON.stringify(entry, null, 2)))

        if (!info) {
          throw err
        }
      }
    })

  if (added > 0) {
    info && console.log(`added ${ added } entries into ${ entity }`)
  }
}
