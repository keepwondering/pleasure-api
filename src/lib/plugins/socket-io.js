import socketIo from 'socket.io'
import { getConfig } from 'lib/get-config.js'
import castArray from 'lodash/castArray'
import get from 'lodash/get'

let PleasureEntityMap
let jwt

const config = {
  getDeliveryGroup (auth) {
    return get(auth, 'level', '$global')
  }
}

const userGroups = ['$global']
let io

export default {
  name: 'io',
  config,
  init ({ pleasureEntityMap, pluginsApi, server, config }) {
    PleasureEntityMap = pleasureEntityMap
    jwt = pluginsApi.jwt

    const { prefix } = getConfig()
    const { getDeliveryGroup } = config

    io = socketIo(server, { path: `${ prefix }-socket` })
    const unauthorized = new Error('unauthorized')

    io.use(async (socket, next) => {
      // wait until initialized
      if (!PleasureEntityMap) {
        return next(unauthorized)
      }

      let user

      if (socket.handshake.headers['authorization']) {
        const jwtToken = socket.handshake.headers['authorization'].split(' ')[1]
        let valid = false

        try {
          valid = await jwt.isValidSession(jwtToken)
        } catch (err) {}
        if (!valid) {
          console.log(`invalid token!!!!`)
          return next(unauthorized)
        }

        user = await jwt.verify(jwtToken)
        next()
      }

      let userGroup

      try {
        userGroup = getDeliveryGroup(user)
      } catch (err) {
        return next(err)
      }

      socket.join('$global')

      if (user) {
        socket.join(`$user-${ user._id }`)
      }

      if (userGroup) {
        castArray(userGroup).forEach(group => {
          if (userGroups.indexOf(group) < 0) {
            userGroups.push(group)
          }
          socket.join(group)
        })
      }

      return next()
    })
  },
  methods: {
    getUserGroups () {
      return userGroups
    },
    notify (userId, event, payload) {
      return io.to(`$user-${ userId }`).emit(event, payload)
    },
    socketIo () {
      // this scope should have a bunch of sugar to access different parts of the api
      // since here is where most of the logic is gonna be written
      return io
    }
  }
}
