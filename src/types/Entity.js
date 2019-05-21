/**
 * @typedef {Object} API.Entity
 *
 * ![mvc pattern](/artifacts/mvc-pattern.jpg)
 *
 * A `Entity` is a file exporting an object with the representation of the `model` and `controller` components
 * found in an `mvc` pattern, putted altogether.
 *
 * If you are familiar with mongoose, The `model.schema` property would be the object passed to the `Schema` constructor
 * in mongoose, and the property `model.schemaOptions` would the options of the mongoose `Schema` constructor.
 *
 * i.e. `new mongoose.Schema(Entity.model.schema, Entity.model.schemaOptions)`.
 * See [Defining your schema](https://mongoosejs.com/docs/guide.html#definition) in the mongoose documentation website.
 *
 * @property {String} name - Optional name of the entity. This value will be used as the mongoDB collection name
 * and `key` name of the entity in the {@link PleasureEntityMap}. If not present, it will default to a `kebabCase`
 * representation of the filename without the extension.
 * @property {String} [extend] - Optional name of another entity to extend. Extending another entity means implementing
 * another entity's schema and methods. See {@tutorial Extending an entity}.
 * @property {String} [discriminator] - Optionally discriminate another entity. See {@tutorial /discriminating-an-entity}.
 * @property {Object} model - An object that describes the `model` component found in an `mvc` pattern. It holds the
 * schema, methods, hooks and other options of a `model`.
 * @property {Object} [model.schemaOptions] - Optional mongoose schema options.
 * {@link https://mongoosejs.com/docs/guide.html#definition Defining your Schema} in the mongoose documentation.
 * @property {Object} model.schema - Object passed as the first argument of the mongoose schema constructor.
 * @property {Object} [model.schema.$pleasure] - Additional arbitrary object to share along with the schema model via
 * the API client driver. The intention of this object
 * @property {Object} [model.schema.$pleasure.placeholder] - Sets the component's placeholder value.
 * @property {Object} [model.schema.$pleasure.label] - Sets the component's label value.
 * @property {Function} [model.schemaCreated] - Hook called once the mongoose schema is created. Receives an object with
 * mongoose schema as the first argument.
 * @property {Function} [model.modelCreated] - Called once all mongoose models are created. Receive arguments
 * `(model, entities)`. `model` being the instance of the mongoose model created and `entities` the {PleasureEntityMap}.
 * object of all created entities. {@tutorial hooks/model-created}
 * @property {ApiAccess} [access] - Access setup for this entity.
 * @property {Object} [flux] - Optional configuration for the flux-pattern delivery.
 * @property {Function} flux.getDeliveryGroup - Function called with the JWT user in session (if any, null otherwise)
 * that must resolve a {String} indicating the delivery group for the flux-pattern functionality. If none present will
 * default to `(auth) => { auth.level  || 'global' }`
 *
 * @see [mongoose](https://mongoosejs.com)
 * @see [mongoose Schemas](https://mongoosejs.com)
 */

export default {
  name: null,
  discriminator: null,
  extend: null,
  flux: {
    access: {
      /**
       * @callback Entity#flux#access#create
       * @param entry - The mongoose entry
       *
       * Called every time an entry that belongs to the entity is created. Must return an array indicating the
       * group of clients that should get notified. `true` for all, `false` for none. Defaults to `true`.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      create ({ entry }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#update
       * @param entry - The mongoose entry
       * @param entry.$before - The state of the entry before the update
       * @param entry.$after - The state of the entry after the update
       *
       * Called every time an entry that belongs to the entity is updated. Must return an array indicating the
       * group of clients that should get notified. `true` for all, `false` for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      update ({ entry }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#delete
       * @param {Object} entry - The mongoose entry being deleted
       *
       * Called every time an entry that belongs to the entity is deleted. Must return an array indicating the
       * group of clients that should get notified. `true` for all, `false` for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      delete ({ entry }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#updateMany
       * @param {Object[]} entries - Array with the entries being updated
       *
       * Called every time a bulk update is performed, e.g.
       * `pleasureClient.update('product', ['id1', 'id2'], {...})`.
       *
       * Must return an array indicating the group of clients that should get notified. `true` for all, `false`
       * for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      updateMany ({ entries }) {
        return ['admin']
      },
      /**
       * @callback Entity#flux#access#deleteMany
       * @param {Object[]} entries - Array with the entries being deleted
       *
       * Called every time a bulk delete is performed, for example, by using the  that belongs to the entity is
       * deleted. Must return an array indicating the group of clients that should get notified. `true` for all, `false`
       * for none.
       *
       * @return {String[]|Boolean} - Defaults to `['admin']`
       */
      deleteMany ({ entries }) {
        return ['admin']
      }
    },
    payload: {
      /**
       * @callback Entity#flux#payload#create
       * @param {String} group - Array with the entries being deleted
       * @param {Object} entry - The entry being created.
       *
       * Called every time an entry is created.
       * deleted. Must return an array indicating the group of clients that should get notified. `true` for all, `false`
       * for none. Defaults to `true`.
       *
       * @return {Object} - The payload that must be return to the `group`.
       */
      create ({ group, entry }) {
        return entry
      },
      update ({ entry }) {
        return entry
      },
      delete ({ entry }) {
        return entry
      }
    }
  }
}
