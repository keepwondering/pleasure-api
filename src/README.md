# PleasureApi

PleasureApi is a framework that orchestrates a web based API using [mongodb](https://mongodb.org) with [mongoose](https://mongoosejs.com/)
as a object modeling wrapper, that runs on [koa2](https://koajs.com)


![PleasureApi Overview](../../assets/pleasure-api.png)

- [Concepts](#concepts)
  - [Entity](#pleasureentity)

## Concepts

- [Entity](#pleasureentity)

### Entity

Entity is a file exporting 

```js
module.exports = {
  schema: {
    // object with which a mongoose schema is created
  },
  created (mongooseSchema) {
    // called once the mongooseSchema is created
    // mongooseSchema.pre('save', function (next) {})
    // mongooseSchema.methods.static.
  },
  init (createdModel) {
     // called once the
  }
}
```

## Features
 
- [Load & Initialize Entity](#auto-load-mongoose-schemas)
- Authentication
  - Login method
  - Access Token and Refresh Token
  - JWT sessions
- Revoking Tokens
- Level based access permissions
- Response
- Backup
- Restore

## Todo

- Implement OAuth 2.0 complaint plugin

## Config

```js
// pleasure.config.js
{
  api: {
    entitiesPath, // path to entities files; defaults to: `<root>/entities`
    entitiesUri, // where entities structure are exposed; defaults to: '/entities',
    permissionsPath // path from where the permissions map is loaded; defaults to: `<root>/api/permissions`
  }
}
```

### Auto-load mongoose schemas

Files placed in `<root>/${config.api.entitiesPath}` are loaded automatically when the plugin starts

> <root>/api/entities/user.js
```js
// mongoose schema
module.exports = {
  firstName: {
    type: String
  }
}
```
