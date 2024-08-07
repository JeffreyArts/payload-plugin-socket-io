// import initiateExpressSocketIO from './server/initiateExpressSocketIO'

// export { initiateExpressSocketIO } // Can't do this because it screws up Webpack
import { PluginSocketIO } from './plugin'
export type { PluginTypes } from './types'

export { PluginSocketIO } from './plugin'
export default PluginSocketIO 