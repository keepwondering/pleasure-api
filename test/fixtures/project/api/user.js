const md5 = require('md5')

module.exports = {
  model: {
    schema: {
      fullName: {
        type: String,
        required: true
      },
      email: {
        type: String,
        unique: true,
        required: true
      },
      level: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer'
      },
      password: {
        type: String,
        required: true
      }
    },
    schemaCreated (mongooseSchema) {
      mongooseSchema.pre('save', function (next) {
        if (this.isModified('password')) {
          if (this.password && this.password.length < 6) {
            throw new Error(`Password too short.`)
          }

          this.password = md5(this.password)
        }
        next()
      })

      mongooseSchema.statics.login = async function ({ email, password }) {
        const user = await this.findOne({ email, password: md5(password) })

        if (!user) {
          throw new Error(`error.invalid-credentials`)
        }

        return user.toObject()
      }
    }
  },
  access: {
    create ({ user }) {
      const access = ['_id', 'fullName', 'email', 'password']

      // only admins can set a user level
      if (user && user.level === 'admin') {
        access.push('level')
      }

      return access
    },
    list ({ user }) {
      // only admins can list users
      return user && user.level === 'admin'
    }
  },
  flux: {
    access: {
      create () {
        return ['admin']
      }
    }
  }
}
