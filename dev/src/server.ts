import { InitOptions } from 'payload/config'
import payload from "payload";
import MongoStore from "connect-mongo"
import "dotenv/config"
import Server from "./../../src/server/initiateExpressSocketIO"
import cors from "./utils/loadCorsFromENV"
import customIOroutes from "./socket/custom-routes"

const server = Server(Number(process.env.PORT) || 3000, {
  onConnect: [customIOroutes],
  socketIO: { // Extension of default socketIO options :::: https://socket.io/docs/v4/server-api/
    cors: {
      origin: cors // Array of authorized hosts
    }
  },
  expressSession: { // Extension of default express-session options :::: https://www.npmjs.com/package/express-session
    secret: process.env.PAYLOAD_SECRET,
    // A store is required to use in order prevent memory leaks from the default one
    // Which is not an issue for development purposes, but we have a Mongo instance anyway, so lets just use it :)
    store: MongoStore.create({ 
      mongoUrl: process.env.DATABASE_URI
    })
  }
})

export const start = async (args?: Partial<InitOptions>) => {
  payload.io = server.io, // Adding socketIO server to payload object, so it is accessible from any point in the application
  
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: server.express, // Adding Express server
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
    ...(args || {}),
  })
  
  server.express.get('/', (_, res) => {
    res.redirect('/admin')
  })
}

start()
