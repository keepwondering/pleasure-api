import helmet from 'koa-helmet'
import { getConfig } from '../../../lib/get-config'

export default {
  prepare ({ router }) {
    const { api: { helmet: helmetConfig = {} } } = getConfig()
    router.use(helmet(helmetConfig))
  }
}
