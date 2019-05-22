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
 *
 * @see [mongoose](https://mongoosejs.com)
 * @see [mongoose Schemas](https://mongoosejs.com)
 */

export default {
  name: null,
  discriminator: null,
  extend: null,
}
