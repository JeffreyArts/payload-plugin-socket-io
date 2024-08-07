import { buildConfig } from 'payload/config';
import path from 'path';
import Users from './collections/Users';
import Examples from './collections/Examples';
import Messages from './collections/Messages';
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import  socketIOHandler from "./components/socket-io-handler"
import { PluginSocketIO } from '../../src/index'
import cors from "./utils/loadCorsFromENV"
import customIOroutes from "./socket/custom-routes"


export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),

    components: {
      // Add additional admin components here
      afterNavLinks: [ socketIOHandler ]
    },
    webpack: config => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config?.resolve?.alias || {}),
            react: path.join(__dirname, '../node_modules/react'),
            'react-dom': path.join(__dirname, '../node_modules/react-dom'),
            payload: path.join(__dirname, '../node_modules/payload'),
          },
        },
      }
      return newConfig
    },
  },
  cors,
  editor: slateEditor({}),
  collections: [
    Examples, Users, Messages
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [PluginSocketIO({
    enabled: true,
    dev: true,
    onConnect: [customIOroutes],
  })],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
})
