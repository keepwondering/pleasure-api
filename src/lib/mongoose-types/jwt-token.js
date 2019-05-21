export const JWTToken = {
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
}
