import { loadCSVIntoJSON } from './load-csv-into-json'
import _ from 'lodash'
import chalk from 'chalk'
import Promise from 'bluebird'
import escapeRegexp from 'escape-string-regexp'

export async function importCSV (csvFile, destination, opts = {}) {
  opts = _.defaults(opts, { debug: true })
  const Model = models[destination]

  if (!Model) {
    return
  }

  const dumping = await loadCSVIntoJSON(csvFile, opts)
  // console.log({ dumping })
  const { discriminator, duplicateCheck } = opts
  let added = 0

  await Promise
    .all(dumping)
    .each(async (entry) => {
      if (discriminator && !await discriminator(entry)) {
        console.log('skipping', entry.email)
        return
      }

      entry = _.mapValues(entry, v => {
        try {
          v = JSON.parse(v)
        } catch (err) {
          // console.log({ err })
        }

        return v
      })

      if (duplicateCheck) {
        const find = new RegExp(`^${escapeRegexp(_.get(entry, duplicateCheck).toLowerCase())}$`, 'i')
        const findOne = { [duplicateCheck]: find }
        const existing = await Model.findOne(findOne)
        if (existing) {
          return opts.debug ? console.log(chalk.gray(`Refusing to add ${_.get(entry, duplicateCheck)} in ${destination}. [exists in ${existing._id}]`)) : null
        }
      }

      // console.log('about to add', { entry })

      try {
        await new Model(entry).save()
        // console.log('added...')
        added++
      } catch (err) {
        console.log(err)
        console.log(chalk.red(`import error: ${err.message}`))
        console.log(chalk.red(JSON.stringify(entry, null, 2)))
      }
    })

  if (added > 0) {
    console.log(`added ${added} entries into ${destination}`)
  }
}
