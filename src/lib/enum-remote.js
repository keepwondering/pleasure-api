import defaults from 'lodash/defaults'
import forOwn from 'lodash/forOwn'
import get from 'lodash/get'
import { Error } from 'mongoose'
import Promise from 'bluebird'
import mustache from 'mustache'

const { ValidationError } = Error

const defaultOptions = {
  remoteEnumValidateOnChange: false,
  remoteEnumValidateField: 'value',
  remoteEnumValidationError: `Value {{VALUE}} is not accepted for path {{PATH}}`
}

const mergeDefaultOptions = (options) => {
  return defaults({}, options, defaultOptions)
}

const getRemoteCollection = (field) => {
  return field.options.remoteEnum
}

module.exports = function (schema, options) {
  // console.log(schema)
  // fs.writeFileSync(`${schema.name}.schema.json`, JSON.stringify(schema, null, 2))

  const getRemoteValues = (field) => {
    const { models } = require('./models')
    const collection = models[getRemoteCollection(field)]

    if (!collection) {
      return []
    }

    return collection.find({})
  }

  const getRemoteEnumFields = () => {
    let result = []
    forOwn(schema.paths, (field, path) => {
      const { options } = field

      if (!options.remoteEnum) {
        return
      }

      result.push({ path, field })
    })

    return result
  }

  const remoteEnumFields = getRemoteEnumFields()

  schema.pre('validate', async function (next) {
    let foundError

    const addError = (path, error) => {
      if (!foundError) {
        foundError = new ValidationError()
      }

      foundError.addError(path, error)
    }

    await Promise.each(remoteEnumFields, async ({ field, path }) => {
      let { options } = field
      let possibleValues
      options = mergeDefaultOptions(options)
      // console.log(`checking`, path, options.remoteEnumValidateOnChange)

      if (!options.remoteEnumValidateOnChange || (options.remoteEnumValidateOnChange && this.isModified(path))) {
        try {
          possibleValues = await getRemoteValues(field)
        } catch (err) {
          console.log(`error>>>`, err.message)
          return
        }

        possibleValues = possibleValues.map(value => {
          return get(value, options.remoteEnumValidateField)
        })

        // console.log({ possibleValues })

        if (!options.required && !this[path]) {
          return
        }

        if (possibleValues.indexOf(this[path]) < 0) {
          console.log(`refusing ${path} with value ${this[path]}`)
          addError(path, new Error(mustache.render(options.remoteEnumValidationError, {
            PATH: path,
            VALUE: this[path]
          })))
        }
      }
    })

    next(foundError)
  })
}

module.exports.defaultOptions = defaultOptions
