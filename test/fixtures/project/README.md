# Dummy project

As an example, will demonstrate the functionality of the pleasure framework in the scenario of an online store.

- [Configuration](#dummy-project-configuration)
- [Entities & Access](#dummy-project-entities--access)

### Dummy Project Configuration

```js
// pleasure.config.js

module.exports = {
  api: {
    debug: process.env.NODE_ENV === 'development',
    entitiesUri: '/schemas'
  }
}
```

### Dummy Project Entities & Access

To start, we will create the DB structure of our online store. To do so, we are gonna set entities for:
user, product and order, by creating their corresponding files and exporting a [PleasureEntity](#pleasure-entity).

```js
// api/user.js

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
```

```js
// api/product.js

module.exports = {
  model: {
    schema: {
      name: String,
      description: String,
      categories: {
        type: Array
      },
      price: {
        type: Number,
        default: 0
      },
      stock: {
        type: Number,
        default: 0
      }
    },
    schemaCreated (schema) {
      schema.index({ name: 'text' })
    }
  },
  controller: {
    // controller methods
    oliviasFavorite ({ entry, params, user } = {}) {
      return this.find({ categories: { $in: ['health'] } })
    }
  },
  access: {
    create ({ user }) {
      // only admins can create products
      return user && user.level === 'admin'
    }
  },
  flux: {
    access: {
      create (/* entry */) {
        return 'admin'
      }
    },
    payload: {
      create (/* group */) {
        return true
      }
    }
  }
}
```

```js
// api/order.js

const { Types: { ObjectId }, Schema } = require('mongoose')
const omit = require('lodash/omit')
const { model: { schema: ProductSchema } } = require('./product.js')
const moment = require('moment')

const ProductOrderSchema = Object.assign({}, omit(ProductSchema, ['stock']), {
  quantity: {
    type: Number,
    default: 1
  }
})

module.exports = {
  model: {
    schema: {
      products: {
        type: [ProductOrderSchema],
        default () {
          return []
        }
      },
      user: {
        type: ObjectId,
        ref: 'user'
      },
      created: {
        type: Date,
        default: Date.now
      }
    },
    schemaCreated (schema) {
      schema.virtual('total').get(function () {
        return this.products.reduce((total, { price, quantity }) => {
          return total + (price * quantity)
        }, 0)
      })
    }
  },
  controller: {
    async retrieveNew (payload) {
      // all logic is in your control
      // { params, post, user, ctx } = payload
      return this.find({ created: { $gte: moment().add(-1, 'hours') } })
    }
  },
  access: {
    create ({ user, appendEntry }) {
      if (!user) {
        return false
      }

      // assign the order to the current user
      appendEntry.user = user._id
      return true
    },
    list ({ user, queryFilter }) {
      // un-authenticated users can not list orders
      if (!user) {
        return false
      }

      // if is an admin, list all orders
      if (user.level === 'admin') {
        return true
      }

      // list only current user's orders
      queryFilter.push(doc => {
        // use mongoose query object
        return doc.find({ user: user._id })
      })

      return true
    }
  }
}
```
