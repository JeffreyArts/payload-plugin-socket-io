import { InitOptions } from 'payload/config'
import payload from "payload";
import MongoStore from "connect-mongo"
import "dotenv/config"
import cors from "./utils/loadCorsFromENV"
import Server from "./../../src/server/initiateExpressSocketIO"

const server = Server(Number(process.env.PORT) || 3000, {
  socketIO: {
    cors: {
      origin: cors
    }
  },
  expressSession: {
    secret: process.env.PAYLOAD_SECRET,
    store: MongoStore.create({ // A store is required to use to prevent memory leaks, Mongostore is just used because mongoDB was already included 
      mongoUrl: process.env.DATABASE_URI
    })
  }
})

export const start = async (args?: Partial<InitOptions>) => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: server.express, // Adding Express server
    io: server.io, // Adding socketIO server
    cors: cors,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
    ...(args || {}),
  })


  const app = server.express

  server.express.get('/api/test', (req, res) => {
    console.log("Test sessionId:", req.sessionID, req.session)
    res.send('hello world')
  })
}

start()
