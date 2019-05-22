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
        return true
      },
      update (/* entry */) {
        return true
      },
      delete (/* entry */) {
        return true
      }
    },
    payload: {
      create ({ entry }) {
        return entry
      },
      /*
            update ({ entry }) {
              return entry
            }
      */
    }
  }
}
