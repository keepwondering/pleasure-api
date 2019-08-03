/*!
 * pleasure-api v1.0.0-beta
 * (c) 2018-2019 Martin Rafael Gonzalez <tin@devtin.io>
 * Released under the MIT License.
 */
import { packageJson, getConfig as getConfig$1, mergeConfigWithEnv, extendConfig, readdirAsync, findRoot, EventBus } from 'pleasure-utils';
import kebabCase from 'lodash/kebabCase';
import merge from 'deepmerge';
import Promise$2 from 'bluebird';
import path from 'path';
import mongoose, { Schema, Types } from 'mongoose';
export { default as mongoose } from 'mongoose';
import defaults from 'lodash/defaults';
import Router from 'koa-router';
import helmet$1 from 'koa-helmet';
import { getConfig as getConfig$2 } from 'pleasure-api';
import Boom from 'boom';
import jwtAuthentication from 'pleasure-api-plugin-jwt';
import forOwn from 'lodash/forOwn';
import camelCase from 'lodash/camelCase';
import mapValues from 'lodash/mapValues';
import merge$1 from 'lodash/merge';
import get from 'lodash/get';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import socketIo from 'pleasure-api-plugin-socket-io';
import fluxPattern from 'pleasure-api-plugin-flux';
import qs from 'qs';
import { addedDiff, updatedDiff } from 'deep-object-diff';
import size from 'lodash/size';
import dot from 'dot-object';
import forEach from 'lodash/forEach';
import castArray from 'lodash/castArray';
import compact from 'lodash/compact';
import mkdirp from 'mkdirp';
import moment from 'moment';
import padStart from 'lodash/padStart';
import fs from 'fs';
import querystring from 'querystring';
import tar from 'tar';
import rimraf from 'rimraf';
import csv from 'csvtojson/v1';
import _, { get as get$1 } from 'lodash';
import concat from 'lodash/concat';
import chalk from 'chalk';
import escapeRegexp from 'escape-string-regexp';
import { printCommandsIndex } from 'pleasure-cli';
import Koa from 'koa';
import koaBody from 'koa-body';
import { Nuxt, Builder } from 'nuxt';
import chokidar from 'chokidar';

const { name } = packageJson();

let init;

const _default = {
  prefix: '/api',
  port: 3000,
  collectionListLimit: 100,
  collectionMaxListLimit: 300,
  createEntityTimeout: 3000,
  mongodb: {
    host: 'localhost',
    port: 27017,
    database: kebabCase(name),
    username: null,
    password: null,
    driverOptions: {
      autoIndex: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 500,
      promiseLibrary: Promise$2,
      poolSize: 5,
      useNewUrlParser: true
    }
  },
  entitiesPath: 'api', // relative to <project-root>
  entitiesUri: '/entities'
};

/**
 * @typedef {Array} TimeUnit
 *
 * An Array representing a length of time in the form of:
 * [amount, unit] as specified by [moment.js#add]{@link https://momentjs.com/docs/#/durations/add/}
 *
 * @property {Number} 0 - Amount of 'units'
 * @property {String} 0 - Unit of time. ie: months, weeks, minutes, seconds, etc.
 */

/**
 * @typedef {Object} API.ApiConfig
 * @summary: The API configuration object.
 * @desc The way to setup
 *
 * @property {String} [prefix=/api] - URI Prefix where to expose the API. `null` for `/`
 * @property {Number} [port=3000] - Default port where to start the application via `$ pls app start`.
 * @property {Number} [timeout=15000] - Specifies how long a client must wait for the api to respond, in milliseconds
 * @property {Number} [collectionListLimit=100] - Default collection list limit
 * @property {Number} [collectionMaxListLimit=300] - Maximum list limit to be set by a client
 * @property {Number} [createEntityTimeout=3000] - Milliseconds to wait for mongoose to connect to MongoDB and
 * initialize all of the schemas. Would raise an "Entity creation timeout" error after this time.
 * @property {MongoDBConfig} mongodb - MongoDB credentials
 * @property {String} [entitiesPath=api/] - Path from where to load files containing #Entity, relative to project root
 * @property {String} [entitiesUri=/entities] - URI where to expose the #PleasureEntityMap
 * @property {ApiPlugin[]} [plugins] - Optional {@link ApiPlugin}'s to hook when used via cli `$ pls app start`.
 * @property {Object} [ui] - Optional object configuration for `nuxt-pleasure`.
 * @property {Object} [ui.postCssVariables] - Optional object variables for `postcss-css-variables`.
 * @property {String[]} [ui.watchForRestart] - Array of files or directories to watch and auto restart the application.
 * @example PostCSS Variables
 *
 * ```js
 * module.exports = {
 *   api: {
 *     postCssVariables: {
 *       theme: {
 *         profile: {
 *           background: `#fc0`, // can be accessed via var(--theme-profile-background) in any postcss scope
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 */

/**
 * @method API.getConfig
 * @param {Object} [override] - Optionally overrides local config
 * @return {ApiConfig}
 */

function getConfig (override = {}) {
  if (init) {
    return init
  }

  const apiConfig = merge.all([{}, _default, getConfig$1('api', override, false, false)]);
  return mergeConfigWithEnv(apiConfig, 'PLEASURE_API')
}

extendConfig('api', getConfig);

/**
 * @typedef {Object} API.Entity
 * @memberOf API
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

var Entity = {
  name: null,
  discriminator: null,
  extend: null,
};

function getCollectionName (name) {
  return kebabCase(name)
}

/**
 * @typedef {Object} PleasureEntityMap
 *
 * An object keyed by collection name containing it's {@link Entity}
 *
 * @example
 *
 * module.exports = {
 *   someEntityName: {}, // Entity
 *   someOtherEntityName: {} // Entity
 * }
 */

/**
 * Resolves the project entities.
 * @async
 * @returns {Promise<PleasureEntityMap>} - An object with all PleasureEntities
 * @see PleasureEntityMap
 */
async function getPleasureEntityMap () {
  const { entitiesPath } = getConfig();
  const schemaFiles = await readdirAsync(findRoot(entitiesPath));

  const PleasureSchemaMap = {};

  schemaFiles.filter(file => /\.js/.test(file)).forEach(entity => {
    const schemaPath = findRoot(entitiesPath, entity);
    // todo: fix access, make it extendable
    const pleasureEntity = require(schemaPath);

    const name = pleasureEntity.name || getCollectionName(path.parse(entity).name);

    PleasureSchemaMap[name] = merge.all([Entity, pleasureEntity, { name }]);
  });

  return PleasureSchemaMap
}

/**
 * @typedef MongoClient
 * @type Object
 * @ignore
 * @see http://mongodb.github.io/node-mongodb-native/3.2/api/MongoClient.html#.connect
 */

/**
 * @typedef mongoose
 * @type Object
 * @ignore
 * @see https://mongoosejs.com/
 */

mongoose.set('useCreateIndex', true);

mongoose.Promise = require('bluebird');
mongoose.plugin(require('mongoose-beautiful-unique-validation'));
mongoose.plugin(require('mongoose-autopopulate'));
// mongoose.plugin(require('./enum-remote'))

const pif = (w, what = null) => {
  return w ? what || w : ''
};

function getMongoCredentials (additional) {
  const { mongodb } = getConfig(additional ? { mongodb: additional } : {});
  return mongodb
}

function getMongoUri (credentials) {
  const { username, password, host, port, database } = getMongoCredentials(credentials);
  // console.log({ host, database })
  return `mongodb://${ pif(username) }${ pif(password, ':' + password) }${ pif(username, '@') }${ host }:${ port }/${ database }`
}

/**
 * @typedef {Object} API.MongoDBConfig
 * @property {String} host=localhost - MongoDB host
 * @property {Number} port=27017 - MongoDB port
 * @property {Number} database=<project-name> - kebabCase representation of the project name
 * @property {String} [username] - MongoDB username
 * @property {String} [password] - MongoDB password
 */

/**
 * Establishes a connection to a mongoDB server and returns the connection.
 *
 * @method API.getMongoConnection
 * @param {API.MongoDBConfig} [config] - Optional configuration object to override local configuration.
 * @see {@link API.MongoDBConfig}
 *
 * @return {Object} The mongodb connection
 *
 * @example Handling DB errors
 *
 * ```js
 * const { api: { getMongoConnection }, getConfig } = require('pleasure')
 * const conn = getMongoConnection()
 *
 * conn.on('connected', () => {
 *   const { api: { MongoDBConfig: { host, port, database } } } = getConfig()
 *   console.log(`Connected to ${host}:${port}/${database}`)
 * })
 *
 * conn.on('error', (err) => {
 *   console.log(`A mongoDB error occurred`)
 * })
 * ```
 */
function getMongoConnection (config) {
  const { debug, mongodb, mongodb: { driverOptions } } = getConfig(config ? { mongodb: config } : {});

  const connection = mongoose
    .createConnection(getMongoUri(mongodb), driverOptions);

  connection.on('connected', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB connected');
  });

  connection.on('disconnected', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB disconnected');
  });

  connection.on('reconnected', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB reconnected');
  });

  connection.on('error', function (err) {
    if (!debug) {
      return
    }

    console.log('MongoDB event error: ' + err);
  });

  connection.on('close', function () {
    if (!debug) {
      return
    }

    console.log('MongoDB closed');
  });

  return connection
}

let currentConnection = null;

function getMongoose () {
  if (currentConnection) {
    return currentConnection
  }

  currentConnection = getMongoConnection();

  return currentConnection
}

async function initializeEntities () {
  const { emit } = EventBus();
  const entities = {};
  const mongoose = getMongoose();
  const pleasureEntityMap = await getPleasureEntityMap();
  const discriminated = [];
  const extended = [];
  const initFns = [];

  const exhaust = (arr, cb) => {
    while (arr.length > 0) {
      let initLength = arr.length;
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (cb(item)) {
          arr.splice(i, 1);
          i--;
        }
      }
      if (arr.length === initLength) {
        throw new Error(`Infinite iteration.`)
      }
    }
  };

  const createSchema = (entityName) => {
    if (entities[entityName]) {
      return
    }

    //console.log({ entityName })
    const { extend, discriminator, model, name, access } = pleasureEntityMap[entityName];

    if (!model) {
      console.error(`Entity ${ entityName } is missing the model.`);
      return
    }

    if (extend) {
      return createSchema(defaults(pleasureEntityMap[entityName], pleasureEntityMap[extend]))
    }

    if (
      (discriminator && !entities[discriminator]) ||
      (extend && !entities[extend]) ||
      (extend && discriminator)
    ) {
      return
    }

    const mongooseSchema = new Schema(model.schema, merge({
      toObject: {
        virtuals: true
      },
      toJSON: {
        virtuals: true
      }
    }, model.schemaOptions || {}));

    mongooseSchema.pre('save', function (next) {
      if (this.isNew) {
        this.wasNew = this.isNew;
      }
      next();
    });

    // triggers created
    model.schemaCreated && model.schemaCreated(mongooseSchema);
    emit('schema-created', { entityName, mongooseSchema });

    const mongooseModel = entities[entityName] = discriminator ? entities[discriminator].discriminator(name, mongooseSchema) : mongoose.model(name, mongooseSchema, name);

    // also discriminate and extend access
    if (discriminator || extend) {
      pleasureEntityMap[entityName].access = merge(pleasureEntityMap[discriminator || extend].access || {}, access || {});
      // console.log(`extending access`, pleasureEntityMap[entityName].access)
    }

    initFns.push(entities => {
      /**
       * Called when the mongoose model is created from a {@link Entity}
       *
       * @event Entity#modelCreated
       * @type Object
       * @property {Object} model - mongoose model
       * @property {PleasureEntityMap} entities - Pleasure entities
       */
      model.modelCreated && model.modelCreated({ mongooseModel, entities });
      emit('model-created', { model: mongooseModel, entities });
    });

    return mongooseModel
  };

  Object.keys(pleasureEntityMap).filter(entityName => {
    if (pleasureEntityMap[entityName].discriminator) {
      discriminated.push(entityName);
    } else if (pleasureEntityMap[entityName].extend) {
      extended.push(entityName);
    }
    return !pleasureEntityMap[entityName].extend && !pleasureEntityMap[entityName].discriminator
  })
    .forEach(createSchema);

  exhaust(extended, createSchema);
  exhaust(discriminated, createSchema);

  initFns.forEach(fn => {
    fn(entities);
  });

  emit('pleasure-entity-map', pleasureEntityMap); // todo: check why emit hanging
  return { entities, schemas: pleasureEntityMap }
}

let entities = null;
let schemas = null;
let initializing;
const finish = [];
const rejects = [];

/**
 * @method API.getEntities
 * @summary Looks & initializes (if not initialized already) all entities found in the path `entitiesPath` located in {@link API.ApiConfig}
 * @desc Lists all `*.js` files found in {@link API.ApiConfig}`->entitiesPath` and initializes their respective mongoose
 * models.
 *
 * @return {Promise<{ schemas, entities }>} An object containing all {@link Entity Entities} and their respective
 * schemas found in the project.
 */
async function getEntities () {
  if (entities) {
    return { entities, schemas }
  }

  if (initializing) {
    return new Promise((resolve, reject) => {
      rejects.push(reject);
      finish.push(resolve);
    })
  }

  const { createEntityTimeout } = getConfig();

  initializing = true;
  const toC = setTimeout(() => {
    rejects.forEach(r => r(new Error(`Entity creation timeout.`)));
  }, createEntityTimeout);

  const { entities: theEntities, schemas: theSchemas } = await initializeEntities(); //todo: check why not resolving
  entities = theEntities;
  schemas = theSchemas;

  clearTimeout(toC);

  finish.forEach(resolve => resolve({ entities, schemas }));

  return { entities, schemas }
}

const DateTime = {
  type: Date,
  options: {
    dateTime: true
  }
};

const JWTToken = {
  sessionId: {
    type: String,
    index: true
  },
  created: {
    type: Date,
    default: Date.now,
    index: true
  },
  expires: {
    type: Date,
    index: true
  }
};

var index = {
  DateTime,
  JWTToken
};

var helmet = {
  name: 'helmet',
  prepare ({ router }) {
    const { helmet: helmetConfig = {} } = getConfig$2('api');
    router.use(helmet$1(helmetConfig));
  }
};

var pleasureContext = {
  name: 'context',
  prepare ({ router }) {
    router.use(async function robots (ctx, next) {
      ctx.response.set('X-Robots-Tag', 'noindex, nofollow');
      return next()
    });

    // return response time in X-Response-Time header
    router.use(async function responseTime (ctx, next) {
      const t1 = Date.now();
      await next();
      const t2 = Date.now();
      ctx.set('X-Response-Time', Math.ceil(t2 - t1) + 'ms');
      // console.log(`response time...`, Math.ceil(t2 - t1) + 'ms')
    });

    // pleasure context
    router.use(async (ctx, next) => {
      ctx.$pleasure = {
        res: null,
        errors: [],
        error (error) {
          this.errors.push(error);
        }
      };

      try {
        await next();
      } catch (err) {
        console.log(err);
        ctx.body = (Boom.isBoom(err) ? err : Boom.badRequest(err.message)).output.payload;
      }
    });
  }
};

let schemaPath;

/* const fs = require('fs')
 !fs.existsSync('tmp') && fs.mkdir('tmp') */

async function getSchemaPaths () {
  if (schemaPath) {
    return schemaPath
  }

  schemaPath = {};

  // const { api: { permissionsPath } } = getConfig()
  // console.log({ permissionsPath })
  // const permissions = require(permissionsPath)
  const { entities } = await getEntities();

  forOwn(entities, (entity, entityName) => {
    entityName = camelCase(entityName);
    // fs.writeFileSync(`tmp/${modelName}.json`, JSON.stringify(_.get(model, 'schema'), null, 2))
    // todo: move $order and $render to ui
    // const appendExtraInfo = pick(permissions[entityName], ['$order', '$render'])

    merge$1(
      schemaPath,
      {
        [entityName]: JSON.parse(JSON.stringify(get(entity, 'schema.paths')))
      },
      {
        [entityName]: JSON.parse(JSON.stringify(mapValues(omit(get(entity, 'schema.virtuals'), ['id', '__v']), v => {
          return merge$1({
            options: {
              options: {
                virtual: true,
                readonly: true
                // hidden: true
              }
            }
          })
        })))
      }
    );
  });

  return schemaPath
}

var schemas$1 = {
  name: 'schemas',
  prepare ({ router }) {
    const api = getConfig();

    let schemas;

    getSchemaPaths()
      .then(entitiesSchema => {
        forOwn(entitiesSchema, (entity, entityName) => {
          forOwn(entity, (field, fieldName) => {
            const $pleasure = get(field, `options.$pleasure`);
            defaults(field, {
              path: fieldName,
              $pleasure
            });
            $pleasure && delete field.options.$pleasure;
            entity[fieldName] = pick(field, ['path', 'instance', 'options', 'enumValues', '$pleasure']);
          });
          entitiesSchema[entityName] = omit(entitiesSchema[entityName], ['__v']);
        });
        // console.log({entitiesSchema})

        schemas = entitiesSchema;
      });

    router.get(`${api.entitiesUri}`, async (ctx, next) => {
      if (!schemas) {
        console.log(`schemas not ready :\\`);
        return next()
      }

      ctx.$pleasure.res = schemas;
      return next()
    });
  }
};

function parseNumberAndBoolean (v) {
  if (typeof v === 'object' && !Array.isArray(v)) {
    return mapValues(v, parseNumberAndBoolean)
  }

  if (Array.isArray(v)) {
    return v
  }

  if (/^-?[\d]+(\.[\d]+)?$/.test(v)) {
    return Number(v)
  }

  if (/^(true|false)$/.test(v)) {
    return v === 'true'
  }

  return v
}

async function create ($pleasureApiCtx) {
  const { entity, newEntry, entryGranted, entryResult, access } = $pleasureApiCtx;
  const notGranted = addedDiff(entryGranted, newEntry);

  if (size(notGranted) > 0) {
    throw Boom.badRequest(`Access to ${ Object.keys(notGranted) } were not granted.`)
  }

  const theEntry = new entity(entryResult);
  theEntry.$pleasure = $pleasureApiCtx;

  return theEntry.save()
}

/**
 * Used to throw errors returned by the API server.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error|Error}
 */
class ApiError extends Error {
  /**
   *
   * @param {String} error - Error name.
   * @param {String} message
   * @param {Number} [code=500] - Error number.
   * @param data
   */
  constructor (error, message, code = 500, data) {
    super(error);
    this.message = message;
    this.code = code;
    this.data = data;
  }
}

async function read ({ entity, id, entryPath, queryFilter }) {
  let doc = await queryFilter(entity.findById(id));
  const fullIdentifier = id + (entryPath ? `/${entryPath}` : '');

  if (entryPath) {
    doc = get(doc, entryPath);
  }

  if (!doc) {
    throw new ApiError(`${fullIdentifier} not found`, 404)
  }

  return doc
}

function flattenObject (ob) {
  let tgt = {};
  dot.dot(ob, tgt);
  return tgt
}

function mergeWithMongoose (doc, obj) {
  if (!doc) {
    return doc
  }

  forOwn(flattenObject(obj), (value, path) => {
    doc.set(path, value);
  });

  return doc
}

async function update ({ id, entry, newEntry, entryGranted, entryResult, access }) {
  const theEntry = await entry();

  if (!theEntry) {
    throw Boom.badRequest(`Entry not found.`)
  }

  const updating = omit(updatedDiff(theEntry.toObject(), newEntry), ['_id']);
  const notGranted = addedDiff(entryGranted, updating);

  if (size(notGranted) > 0) {
    throw Boom.badRequest(`Access to ${Object.keys(notGranted)} were not granted.`)
  }

  mergeWithMongoose(theEntry, entryResult);
  return theEntry.save()
}

async function remove ($pleasureApiCtx) {
  const { queryFilter, entry, entity, params: { id, many = false } } = $pleasureApiCtx;

  if (entry) {
    return (await queryFilter(entry)).remove()
  }

  if (typeof id !== 'object') {
    return
  }

  let query = id;

  if (Array.isArray(id)) {
    if (id.length === 0) {
      return
    }

    query = {
      $or: id.map(id => {
        return { _id: id }
      })
    };
  }

  if (many) {
    const result = await entity.find(query).deleteMany();
    return { query, result }
  }

  const entries = await entity.find(query);

  const removed = [];
  const errors = [];

  await Promise$2.each(entries, async entry => {
    try {
      removed.push(await entry.remove());
    } catch (err) {
      errors.push({ _id: entry._id, message: err.message });
    }
  });

  return removed
}

async function list ({ entity, params, queryFilter }) {
  // console.log(`listing`, queryFilter)
  let query = entity.find({});

  if (params.search) {
    query = query.find({ $text: { $search: params.search } });
  }

  if (params.find) {
    // todo: restrict query by access level
    query = query.find(params.find);
  }

  if (params.sort) {
    query = query.sort(params.sort);
  }

  if (params.skip && Number.isInteger(params.skip)) {
    query = query.skip(params.skip);
  }

  if (params.limit && Number.isInteger(params.limit)) {
    query = query.limit(params.limit);
  }

  return queryFilter(query)
}

async function push ({ entity, id, entryPath, newEntry, params }) {
  const doc = await entity.findById(id);
  const array = get(doc, entryPath);

  if (!Array.isArray(array)) {
    const fullIdentifier = `${ id }/${ entryPath }`;
    throw new ApiError(`${ fullIdentifier } not found`, 404)
  }

  if (newEntry.multiple) {
    if (!Array.isArray(newEntry.push)) {
      return
    }
    array.push(...newEntry.push);
  } else {
    array.push(newEntry.push);
  }

  return doc.save()
}

async function pull ({ entity, id, entryPath, pull }) {
  const doc = await entity.findById(id);
  const array = get(doc, entryPath);

  if (!Array.isArray(array)) {
    const fullIdentifier = `${id}/${entryPath}`;
    throw new ApiError(`${fullIdentifier} not found`, 404)
  }

  castArray(pull).forEach(pull => {
    let pullIndex;

    forEach(array, (v, index) => {
      // if it's an object, compare it against the _id
      if (typeof v === 'object' && v.id === pull) {
        pullIndex = index;
        return false
      } else if (typeof v !== 'object' && v === pull) {
        pullIndex = index;
        return false
      }
    });

    if (typeof pullIndex === 'undefined') {
      throw new Error(`${pull} not found`)
    }

    array.splice(pullIndex, 1);
  });

  return doc.save()
}

async function queryFilter (entity, queryFilter = []) {
  if (queryFilter.length > 0) {
    queryFilter.forEach(filter => {
      entity = filter(entity);
    });
    entity = await entity.exec();
  }

  return typeof entity === 'function' ? entity() : entity
}

function resolvePleasureMethod (ctx) {
  let { params: { id, entryPath }, request: { method } } = ctx;

  if (method === 'POST' && !id) {
    if (entryPath) {
      return 'push'
    }

    return 'create'
  }

  if (method === 'POST' && id && entryPath) {
    return 'push'
  }

  if (method === 'GET') {
    if (id) {
      return 'read'
    }

    return 'list'
  }

  if (method === 'PATCH') {
    if (entryPath) {
      return 'patch'
    }

    return 'update'
  }

  if (method === 'DELETE') {
    if (entryPath) {
      return 'pull'
    }

    return 'delete'
  }
}

/**
 * @typedef {Function} ApiHook
 * @desc A function that attaches to an {@link API.Access} request.
 *
 * @param {ApiContext} apiContext - ApiContext of the request. See {@link ApiContext}
 *
 * @return {Boolean|String[]} - `true` to perform the operation, `false` otherwise. Alternatively, an array of strings
 * representing each field of the entity that the request is granted access to. Defaults to `false`.
 *
 * @example
 *
 * function create ({ user }) {
 *   return user.level === 'admin'
 * }
 */

/**
 * @typedef {Object} API.Access
 * @desc Orchestrates access permissions to entities.
 *
 * http calls to the api endpoint are treated as follow:
 *
 * | HTTP method | Endpoint | Access Triggered | Description |
 * | :--- | :--- | :--- | :--- |
 * | POST | `/:entity` | `create` | Creates a new entry into `/:entity` |
 * | GET | `/:entity/:id/:target?` | `read` | Retrieves the entry defined by `/:id` (optionally returns only the property `/:target` of the entry, if any) |
 * | PATCH | `/:entity/:id/:dotted-path-to-some-field` or `/:entity?id=[...]` | `update` | Updates entry referred as `/:id` or `?id=[...]` |
 * | DELETE | `/:entity/:id` | `delete` | Deletes entry referred as `/:id` |
 * | GET | `/:entity` | `list` | Lists entries in an entity |
 * | POST | `/:entity/:id/:path-to-array-field` | `push` | Pushes into an entry's array |
 * | DELETE | `/:entity/:id/:path-to-array-field-id` | `pull` | Pulls out of an entry's array |
 *
 * @property {ApiHook} create - Called when attempting to create one or several entry(s) in an entity.
 * @property {ApiHook} read - Called when attempting to read an entry of the entity.
 * @property {ApiHook} update - Called when attempting to update one or several entry(s) from the entity.
 * @property {ApiHook} delete - Called when attempting to delete one or several entry(s) from the entity.
 * @property {ApiHook} push - Called when attempting to push into an entry's array.
 * @property {ApiHook} pull - Called when attempting to pull out of an entry's array.
 */

function anyUser ({ user }) {
  return !!user
}

function anyBody () {
  return true
}

var defaultPermissions = {
  create: anyUser,
  read: anyBody,
  update: anyUser,
  delete: anyUser,
  list: anyBody,
  push: anyUser,
  pull: anyUser
};

/**
 *
 * @param {Object} schemas - Schema map
 * @return {Promise<void>}
 */
function getPermissions (schemas) {
  const permissions = {};
  // todo: fix access
  Object.keys(schemas).forEach(Entity => {
    permissions[Entity] = merge.all([{}, defaultPermissions, schemas[Entity].access || {}]);
  });

  return permissions
}

var authorization = /*#__PURE__*/Object.freeze({
  getPermissions: getPermissions
});

function filterAccess (res, access) {
  if (typeof access === 'boolean' && access) {
    return res
  }

  return pick(res, access)
}

const { ObjectId } = Types;

/**
 * Determines whether a given value is an ObjectId or not
 *
 * @param {String} id - The id to validate
 * @return {Boolean} - Whether `id` is or not a valid ObjectId
 */
function isObjectId (id) {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id
}

let entities$1 = null;
let pleasureEntityModelMap = null;
let permissions = null;

var router = {
  name: 'crud-router',
  prepare ({ router, getEntities }) {
    getEntities()
      .then(({ entities: e, schemas }) => {
        permissions = getPermissions(schemas);
        entities$1 = e;
        pleasureEntityModelMap = schemas;
      });

    router.use((ctx, next) => {
      ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      ctx.set('Pragma', 'no-cache');
      ctx.set('Expires', '0');

      ctx.$pleasure.$api = {};

      // assign user from jwt-authentication, in case of any
      ctx.$pleasure.$api.user = ctx.$pleasure.user;

      if (!entities$1 || !permissions) {
        ctx.body = { initializing: true };
        return
      } else {
        ctx.$pleasure.$api.entities = entities$1;
      }

      return next()
    });

    router.all('/:model/:id?/:entryPath?', async function (ctx, next) {
      if (!ctx.$pleasure.$api.entities) {
        return next()
      }

      let { model, id, entryPath } = ctx.params;
      const { body: newEntry } = ctx.request;
      // let entity = ctx.$pleasure.$api.entities[model]
      let entry;

      if (!ctx.$pleasure.$api.entities[model]) {
        return next()
      }

      let entity = ctx.$pleasure.$api.entities[model]; // mongoose.model(model)

      const { querystring } = ctx.request;
      const params = parseNumberAndBoolean(qs.parse(querystring, { interpretNumericEntities: true }));

      let controller;
      // todo: check if id is an objectId
      //  if it's not an ObjectId, it must be treated as an entity controller method
      if (isObjectId(id)) {
        // store resolved entry in cache
        let resolvedEntry;
        entry = () => {
          if (resolvedEntry) {
            return resolvedEntry
          }
          return entity.findById(id)
            .then(entry => {
              if (entry) {
                entry.$pleasure = ctx.$pleasure.$api;
              }
              resolvedEntry = entry;
              return entry
            })
        };
      } else if (id) {
        const controllerMethod = id;
        id = null;
        const controllerPath = `controller.${ camelCase(controllerMethod) }`;
        controller = get(pleasureEntityModelMap[model], controllerPath);

        if (!controller) {
          // id not valid and controller does not exists
          ctx.$pleasure.error(Boom.badRequest(`Invalid entity id or controller`));
          return next()
        }

        ctx.$pleasure.res = await controller.call(entity, {
          params,
          post: newEntry,
          user: ctx.$pleasure.user,
          ctx
        });

        return next()
      }

      const method = resolvePleasureMethod(ctx);

      if (!method) {
        return next()
      }

      Object.assign(ctx.$pleasure.$api, {
        queryFilter (entity) {
          // console.log(`queryFilter`, { entity }, ctx.$pleasure.$api.queryFilter)
          return queryFilter(entity, ctx.$pleasure.$api._queryFilter)
        },
        overrideReadAccess (newAccess) {
          ctx.$pleasure.$api.overriddenReadAccess = newAccess;
        },
        overriddenReadAccess: undefined,
        _queryFilter: [],
        entity,
        entry,
        newEntry,
        appendEntry: {},
        entryPath,
        id,
        method,
        params
      });

      ctx.$pleasure.$api.access = await permissions[model][method](ctx.$pleasure.$api);

      return next()
    });
  },
  methods: {
    getPermissions () {
      if (!pleasureEntityModelMap) {
        return
      }

      return getPermissions(pleasureEntityModelMap)
    }
  },
  extend ({ router }) {
    // list documents
    router.all('/:model/:id?/:entryPath?', async function (ctx, next) {
      const { newEntry, appendEntry, access, entity, method, overriddenReadAccess, params } = ctx.$pleasure.$api;

      if (!entity || !method || !access) {
        return next()
      }

      const { model } = ctx.params;
      let { pull: toPull, multiple } = params || {};

      let resolveFn = () => {};

      const { $api } = ctx.$pleasure;

      const override = d => {
        return Object.assign({}, $api, d)
      };

      const entryGranted = filterAccess(newEntry, access);

      const newContent = override({
        entryGranted,
        entryResult: merge(entryGranted, appendEntry)
      });

      switch (method) {
        case 'create':
          resolveFn = create.bind(null, newContent);
          break

        case 'read':
          resolveFn = read.bind(null, $api);
          break

        case 'update':
          resolveFn = update.bind(null, newContent);
          break

        case 'delete':
          resolveFn = remove.bind(null, $api);
          break

        case 'list':
          resolveFn = list.bind(null, $api);
          break

        case 'patch':
          resolveFn = patch.bind(null, newContent);
          break

        case 'push':
          resolveFn = push.bind(null, newContent);
          break

        case 'pull':
          resolveFn = pull.bind(null, Object.assign({ pull: toPull, multiple }, $api));
          break
      }

      const res = await resolveFn();
      const overrideMethods = {};

      if (method === 'create' && res._id) {
        let foundEntry;
        Object.assign(overrideMethods, {
          async entry () {
            if (foundEntry) {
              return foundEntry
            }
            const entry = await entity.findById(res._id);

            if (entry) {
              entry.$pleasure = ctx.$pleasure.$api;
            }

            foundEntry = entry;

            return entry
          }
        });
      }

      const entryPermissionFilter = async (entry) => {
        const override = {};
        if (entry) {
          Object.assign(override, { entry () { return entry } });
        }
        return overriddenReadAccess || await permissions[model].read(Object.assign({}, ctx.$pleasure.$api, overrideMethods, override))
      };

      if (Array.isArray(res)) {
        ctx.$pleasure.res = await Promise$2.map(res, async entry => filterAccess(entry, await entryPermissionFilter(entry)));
      } else {
        ctx.$pleasure.res = filterAccess(res, overriddenReadAccess || await permissions[model].read(Object.assign({}, ctx.$pleasure.$api, overrideMethods)));
      }

      return next()
    });
  }
};

var pleasureResponse = {
  name: 'response',
  extend ({ router }) {
    // return pleasure api results
    router.use((ctx) => {
      let apiResponse;

      if (ctx.$pleasure.res) {
        apiResponse = {
          statusCode: 200,
          data: ctx.$pleasure.res
        };
      }

      ctx.body = apiResponse || Boom.notImplemented(`Method not implemented`).output.payload;
    });
  }
};

function getPlugins (configOverride) {
  const api = getConfig(configOverride);

  let plugins = [helmet, pleasureContext, jwtAuthentication, schemas$1, socketIo, fluxPattern, router, ...castArray(api.plugins)];
  plugins.push(pleasureResponse); // last plugin is the response handler

  // called before the api logic... schemas are called the last
  const prepare = [];

  // called after the api logic...
  const extend = [];

  const pluginsApi = {};
  const pluginsConfig = {};

  plugins = plugins.filter(Boolean);

  plugins.forEach(plugin => {
    const { config = {} } = plugin;
    const pluginConfig = merge.all([{}, config || {}, get(api, plugin.name, {})]);

    if (!plugin.methods) {
      return
    }

    if (!plugin.name) {
      throw new Error(`plugin exporting methods but no name was assigned: ${ JSON.stringify(plugin) }`)
    }

    pluginsConfig[plugin.name] = plugin.config = pluginConfig;
    pluginsApi[plugin.name] = plugin.methods;
  });

  return { prepare, extend, pluginsApi, pluginsConfig, plugins }
}

/**
 * @function API.pleasureApi
 * @desc Initializes the Data API. This function returns a `koa` plugin orchestrating all of the Data API logic.
 *
 * ```mermaid
 * graph LR
 * A[pleasure] --> B(API)
 * B --> |flux| C
 * D(UI) --> C(Client)
 * C --> |req| B
 * B --> |res| C
 * ```
 *
 * @param {ApiConfig} config - Override local API configuration. See {@link ApiConfig}
 * @param {Server} server - http server. See {@link https://nodejs.org/api/http.html}
 * @return {Function} Koa Plugin.
 *
 * @example <caption>koa as the http server</caption>
 *
 * ```js
 * const { pleasureApi } = require('pleasure')
 * const Koa = require('koa')
 *
 * const app = new Koa()
 * const server = app.listen(3000)
 *
 * app.use(pleasureApi({
 *   prefix: '/api'
 * }, server))
 * ```
 *
 * @example <caption>Using a custom http server</caption>
 *
 * ```js
 * const { pleasureApi } = require('pleasure')
 * const Koa = require('koa')
 * const server = require('http').createServer()
 *
 * const app = new Koa()
 *
 * app.use(pleasureApi({
 *   prefix: '/api'
 * }, server))
 *
 * server.listen(3000, app.callback())
 * ```
 */

function pleasureApi (config, server) {
  // set default config
  const { prefix } = getConfig(config);
  const { on } = EventBus();

  const router = Router({
    prefix
  });

  const { prepare, extend, plugins, pluginsApi, pluginsConfig } = getPlugins(config);

  /**
   * @typedef {Object} PleasureApi.PluginPayload
   * @property {mongoose} mongoose - The mongoose module. {@see https://mongoosejs.com/}
   * @property {mongoose} mongooseApi - The mongoose instance used by the API. {@see https://mongoosejs.com/}
   * @property router - The koa router instance. {@see https://github.com/ZijianHe/koa-router}
   * @property pluginsApi - The koa router instance. {@see https://github.com/ZijianHe/koa-router}
   * @property server - The http server instance. {@see https://nodejs.org/api/http.html#http_class_http_server}
   * @property {Object} pluginsConfig - Object containing all configurations of all plugins. Keyed by plugin name.
   * @property {API.getEntities} getEntities - {@see API.getEntities}
   * @property {API.getConfig} getConfig - {@see API.getConfig}
   * @property {Object} config - Plugin's merged config. The result of merging the default values of the plugin with those
   * set by the user locally in the pleasure.config.js file.
   */

  const mainPayload = {
    mongoose,
    mongooseApi: getMongoose(),
    router,
    pluginsApi,
    server,
    pluginsConfig,
    getEntities,
    getConfig
  };

  const pluginRouter = ({ cb, config }) => {
    return cb(Object.assign({}, mainPayload, { config }))
  };

  plugins.forEach(plugin => {
    const { name, config = {}, schemaCreated, init, prepare: prepareCallback, extend: extendCallback } = plugin;
    // console.log({ name, config })
    merge(config, getConfig()[name] || {});
    // console.log({ config })
    const pluginMainPayload = Object.assign({ config }, mainPayload);

    if (schemaCreated) {
      on('schema-created', (payload) => {
        schemaCreated(Object.assign({}, pluginMainPayload, payload));
      });
    }

    if (init) {
      init(pluginMainPayload);
    }

    if (prepareCallback) {
      prepare.push({ cb: prepareCallback, config, name });
    }

    if (extendCallback) {
      extend.push({ cb: extendCallback, config, name });
    }
  });

  on('pleasure-entity-map', (pleasureEntityMap) => {
    Object.assign(mainPayload, { pleasureEntityMap });
    prepare.forEach(pluginRouter);
    extend.forEach(pluginRouter);
  });

  /*
  todo: this is a workaround in order for the koa-router to trigger middlewares without a specific path
    should be removed as koa-router 8 gets released.
    see: https://github.com/ZijianHe/koa-router/issues/462
   */
  router.all('*', (ctx, next) => {
    return next()
  });

  getEntities()
    .then(() => {
      const { debug } = getConfig$1();
      debug && console.log(`pleasure api initialized`);
    })
    .catch(err => {
      console.error(`An error occurred while loading the entities:`, err);
    });

  return router.routes()
}

/**
 * @typedef {Object} ApiPlugin
 *
 * A pleasure api plugin hooks within the api logic and consists in an Object with two callback function:
 * `prepare` and `extend`.
 *
 * @property {Function} [prepare] - Receives the router as first argument
 * @property {Function} [extend] - Receives the router as first argument
 */

var index$1 = {
  authorization
};

function cleanEmptyArrays (obj) {
  return mapValues(obj, v => {
    if (Array.isArray(v)) {
      return compact(v)
    }

    if (typeof v === 'object' && v !== null) {
      return cleanEmptyArrays(v)
    }

    return v
  })
}

function cleanMongooseEntry (entry) {
  // clean array empties
  return cleanEmptyArrays(entry)
}

const writeFile = Promise$2.promisify(fs.writeFile);

const defaultOptions = {
  savedDocsCountLength: 10,
  docsChunkLength: 1024 * 1024// 1MB chunks
};

class MongoBackup {
  constructor (backupName, options = {}) {
    backupName = backupName || `backup-${moment().format()}`;
    const { basePath } = options;
    const backupsBasePath = basePath || process.cwd();

    this.options = defaults(options, defaultOptions);

    this.backupPath = path.join(backupsBasePath, backupName);
    mkdirp.sync(this.backupPath);

    this.conn = null;
    this.collections = [];

    this._collectionsCreated = {};

    return new Promise$2((resolve) => {
      getMongoConnection().then((conn) => {
        this.conn = conn;
        resolve(this);
      });
    })
  }

  static get defaultOptions () {
    return defaultOptions
  }

  static encodeDoc (doc) {
    // return mongooseDoc.toObject()
    return doc
  }

  collectionCreated (collectionName) {
    return this._collectionsCreated.hasOwnProperty(collectionName)
  }

  createCollection (collection) {
    if (!this.collectionCreated(collection)) {
      mkdirp.sync(path.join(this.backupPath, collection));
      this._collectionsCreated[collection] = { docs: [], sets: 0 };
    }
  }

  async dump (collection) {
    if (!this.collectionCreated(collection)) {
      return
    }

    const docs = this._collectionsCreated[collection].docs.map(MongoBackup.encodeDoc);

    if (docs.length === 0) {
      return
    }

    const setFilePath = path.join(this.backupPath, collection, padStart(this._collectionsCreated[collection].sets, this.options.savedDocsCountLength, '0') + '.json');
    await writeFile(setFilePath, JSON.stringify(docs));

    this._collectionsCreated[collection].sets++;
    this._collectionsCreated[collection].docs = [];
  }

  async saveDoc (collection, doc) {
    this.createCollection(collection);

    this._collectionsCreated[collection].docs.push(doc);
    const save = JSON.stringify(this._collectionsCreated[collection].docs);

    if (save.length >= this.options.docsChunkLength) {
      const docBiggerThanLength = JSON.stringify(doc).length > this.options.docsChunkLength;

      if (docBiggerThanLength && this._collectionsCreated[collection].docs.length > 1) {
        this._collectionsCreated[collection].docs.pop();
      }

      await this.dump(collection);

      if (docBiggerThanLength && this._collectionsCreated[collection].docs.length > 1) {
        return this.saveDoc(collection, doc)
      }
    }
  }

  async backupCollection (name) {
    const cursor = this.conn.collection(name).find();
    while (await cursor.hasNext()) {
      await this.saveDoc(name, await cursor.next());
    }
    await this.dump(name);
  }

  async backup () {
    this.collections = await this.conn.db.listCollections().toArray().map(v => {
      return v.name
    });

    await Promise$2.each(this.collections, this.backupCollection.bind(this));
  }
}

const pif$1 = (w, what = null) => {
  return w ? what || w : ''
};

function getMongoUri$1 (credentials = {}) {
  // important: do not move to the global scope
  const { mongodb } = getConfig$2('api');

  const { username = mongodb.username, password = mongodb.password, host = mongodb.host, port = mongodb.port, database = mongodb.database } = credentials;
  let { driverOptions = {} } = credentials;

  return `mongodb://${pif$1(username)}${pif$1(password, ':' + password)}${pif$1(username, '@')}${host}:${port}/${database}?${querystring.stringify(driverOptions)}`
}

async function backupDB ({ name, compress = true, verbose = true } = {}) {
  const { mongodb } = getConfig$2('api');
  // todo: implement plugins
  // const { tmpFolder, uploadFolder } = require('../../server/utils/project-paths')

  const autoName = `${mongodb.database}-${moment().format('YYYY-MM-DD-HH-mm-ss')}`;
  const backUpName = name || autoName;
  const backUpPath = path.join(process.cwd(), backUpName);

  mkdirp.sync(backUpPath);

  const mongoDBBackup = await new MongoBackup('mongodb', { basePath: backUpPath });
  await mongoDBBackup.backup();

  const file = backUpPath + `.${compress ? 'tgz' : 'tar'}`;

  await tar.c(
    {
      file,
      cwd: backUpPath
    },
    ['./']
  );

  rimraf.sync(backUpPath);

  return { db: getMongoUri$1(), file }
}

const httpMethodToMongoMethod = {
  post: 'create',
  patch: 'update',
  delete: 'delete',
  get: 'read' // conditionally patched to 'list' in the router... nasty...
};

function asteriskToBoolean (obj) {
  return _.mapValues(obj, v => {
    if (typeof v === 'object') {
      return asteriskToBoolean(v)
    }

    return v === '*' ? true : v
  })
}

const resolveCSV = (csvFile) => {
  return path.resolve(__dirname, '../../scripts/init-data', csvFile)
};

const plugins = [asteriskToBoolean/*, resolveFilesToUploads*/];

function process$1 (jsonObj, plugin) {
  return Promise$2
    .resolve(plugin ? concat(plugins, plugin) : plugins)
    .each(async plugin => {
      // console.log({plugin})
      jsonObj = await plugin(jsonObj);
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
async function loadCSVIntoJSON (csvFile, opts) {
  const { plugin } = opts || {};

  return new Promise$2((resolve, reject) => {
    const values = [];

    csv(omit(opts, 'plugin'))
      .fromFile(resolveCSV(csvFile))
      .on('json', (jsonObj) => {
        values.push(process$1(jsonObj, plugin));
      })
      .on('done', async () => {
        resolve(await Promise$2.all(values));
      })
      .on('error', (err) => {
        reject(err);
      });
  })
}

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
async function dumpCSVIntoDB (csvFile, entity, opts = {}) {
  opts = _.defaults(opts, { info: true, debug: false, csv: null });
  const { debug, info } = opts;
  const { entities: models } = await getEntities();
  const Model = models[entity];

  if (!Model) {
    return
  }

  const dumping = await loadCSVIntoJSON(csvFile, opts.csv);
  // console.log({ dumping })
  const { discriminator, duplicateCheck } = opts;
  let added = 0;

  await Promise$2
    .all(dumping)
    .each(async (entry) => {
      if (discriminator && !await discriminator(entry)) {
        debug && console.log('dismissing', JSON.stringify(entry), `by discriminator`);
        return
      }

      entry = _.mapValues(entry, v => {
        try {
          v = JSON.parse(v);
        } catch (err) {
          debug && console.log({ err });
        }

        return v
      });

      if (duplicateCheck) {
        const find = new RegExp(`^${ escapeRegexp(_.get(entry, duplicateCheck).toLowerCase()) }$`, 'i');
        const findOne = { [duplicateCheck]: find };
        const existing = await Model.findOne(findOne);
        if (existing) {
          return info ? console.log(chalk.gray(`Refusing to add ${ _.get(entry, duplicateCheck) } in ${ entity }. [exists in ${ existing._id }]`)) : null
        }
      }

      try {
        await new Model(entry).save();
        debug && console.log('added...');
        added++;
      } catch (err) {
        info && console.log(err);
        info && console.log(chalk.red(`import error: ${ err.message }`));
        info && console.log(chalk.red(JSON.stringify(entry, null, 2)));

        if (!info) {
          throw err
        }
      }
    });

  if (added > 0) {
    info && console.log(`added ${ added } entries into ${ entity }`);
  }
}

const Promise$1 = require('bluebird');

function dropDB () {
  return new Promise$1((resolve, reject) => {
    const { getMongoConnection, getMongoCredentials } = require('../../get-mongoose-connection.js');
    const credentials = getMongoCredentials();
    const connection = getMongoConnection();

    connection.on('connected', () => {
      connection.dropDatabase((err, res) => {
        if (err) {
          return reject(new Error(`Error dropping db: ${ err }`))
        }

        console.log(`Database ${ credentials.database } dropped!`);
        resolve();
      });
    });
  })
}

async function emptyModels () {
  const { entities } = await getEntities();
  const process = [];
  Object.keys(entities).forEach((entityName) => {
    process.push(entities[entityName]);
  });
  return Promise$1
    .each(process, entity => entity.deleteMany({}))
    .catch(err => {
      console.log('remove error', err);
    })
}

var index$2 = {
  dumpCSVIntoDB,
  dropDB,
  emptyModels,
  backupDB,
  cleanMongooseEntry,
  getMongoose,
  httpMethodToMongoMethod,
  parseNumberAndBoolean
};

let runningConnection;
let runningBuilder;
let runningPort;
let runningWatcher;

function watcher () {
  if (runningWatcher) {
    runningWatcher.close();
    runningWatcher = null;
  }

  const nuxtConfigFile = findRoot('./nuxt.config.js');
  const pleasureConfigFile = findRoot('./pleasure.config.js');

  // delete cache
  if (fs.existsSync(nuxtConfigFile)) {
    delete require.cache[require.resolve(nuxtConfigFile)];
  }

  delete require.cache[require.resolve(pleasureConfigFile)];

  const { watchForRestart = [] } = getConfig$2('ui');
  const cacheClean = [nuxtConfigFile, pleasureConfigFile].concat(watchForRestart);
  runningWatcher = chokidar.watch(cacheClean, { ignored: /(^|[\/\\])\../, ignoreInitial: true });

  runningWatcher.on('all', (event, path) => {
    // todo: trigger restart
    restart()
      .catch(err => {
        console.log(`restarting failed with error`, err.message);
      });
  });
}

async function start (port) {
  if (runningConnection) {
    console.error(`An app is already running`);
    return
  }

  const nuxtConfigFile = findRoot('./nuxt.config.js');

  // delete cache
  delete require.cache[require.resolve(nuxtConfigFile)];
  delete require.cache[require.resolve(findRoot('./pleasure.config.js'))];

  const apiConfig = getConfig$2();
  port = port || apiConfig.port;

  let withNuxt = false;
  let nuxt;

  // enable nuxt
  if (fs.existsSync(nuxtConfigFile)) {
    withNuxt = true;
    let nuxtConfig = require(nuxtConfigFile);

    const currentModules = nuxtConfig.modules = get$1(nuxtConfig, 'modules', []);
    const currentModulesDir = nuxtConfig.modulesDir = get$1(nuxtConfig, 'modulesDir', []);
    //console.log({ currentModulesDir })
    currentModulesDir.push(...require.main.paths.filter(p => {
      return currentModulesDir.indexOf(p) < 0
    }));
    //console.log({ currentModulesDir })
    const ui = ['pleasure-ui-nuxt', {
      root: findRoot(),
      name: packageJson().name,
      config: getConfig$2('ui'),
      pleasureRoot: path.join(__dirname, '..')
    }];
    currentModules.push(ui);

    //console.log({ nuxtConfig })
    nuxt = new Nuxt(nuxtConfig);

    // Build in development
    if (nuxtConfig.dev) {
      const builder = new Builder(nuxt);
      runningBuilder = builder;
      await builder.build();
    }
  }

  const app = new Koa();

  app.use(koaBody());

  const server = runningConnection = app.listen(port);
  runningPort = port;

  app.use(pleasureApi({
    prefix: apiConfig.prefix,
    plugins: apiConfig.plugins
  }, server));

  // nuxt
  if (withNuxt) {
    app.use(ctx => {
      ctx.status = 200;
      ctx.respond = false; // Mark request as handled for Koa
      ctx.req.ctx = ctx; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
      nuxt.render(ctx.req, ctx.res);
    });
  }

  process.send && process.send('pleasure-ready');

  watcher();

  return port
}

async function restart () {
  if (!runningPort || !runningConnection) {
    console.error(`No app instance running`);
    return
  }

  if (runningBuilder) {
    await runningBuilder.close();
    runningBuilder = null;
  }

  runningConnection.close();
  runningConnection = null;
  return start(runningPort)
}

const cli = {
  root: {
    command () {
      printCommandsIndex(cli.commands);
    }
  },
  commands: [
    {
      name: 'start',
      help: 'starts the app in production',
      async command (args) {
        const port = await start();
        console.log(`Pleasure running on ${ port }`);
        process.emit('pleasure-initialized');
      }
    }
  ]
};

/**
 * @see {@link https://github.com/maxogden/subcommand}
 */
function cli$1 (subcommand) {
  return {
    name: 'app',
    help: 'app options',
    command ({ _: args }) {
      // console.log(`calling app`, { args })
      const match = subcommand(cli);
      match(args);
    }
  }
}

export { ApiError, index as MongooseTypes, cli$1 as cli, getConfig, getEntities, getMongoConnection, getMongoCredentials, getMongoose, getPermissions, getPleasureEntityMap, getPlugins, initializeEntities, pleasureApi, index$1 as plugins, index$2 as utils };
