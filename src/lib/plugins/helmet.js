import helmet from 'koa-helmet'
import { getConfig } from 'pleasure-api'

export default {
  name: 'helmet',
  prepare ({ router }) {
    const { helmet: helmetConfig = {} } = getConfig()
    router.use(helmet(helmetConfig))
  }
}
