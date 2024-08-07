import { InitOptions } from 'payload/config'
import payload from "payload";
import "dotenv/config"
import express from 'express';
import { createServer } from "node:http";
import { Server } from "socket.io"
import session, { SessionOptions } from "express-session";
import MongoStore from "connect-mongo"
import cors from "./utils/loadCorsFromENV"

const app = express();
app.set('trust proxy', 1)

declare module "payload" {
  interface Payload {
    io?: any; // or use the appropriate type for io
  }
}

const httpServer = createServer(app);
// Adding socketIO server to payload object, so it is accessible from any point in the application
payload.io = new Server(httpServer, {
  cors: {
    origin: cors, // Array of authorized hosts
    methods: ["GET", "POST"], // Required setting
    credentials: true // This property is required when server host differs from client host eg. http://localhost:3000 VS http://localhost:3001
  }
});

const sessionMiddleware = session({
  secret: process.env.PAYLOAD_SECRET,
  resave: false, // Not required, see for details: https://www.npmjs.com/package/express-session#resave
  saveUninitialized: true, // Required, cause on initialisation it sets the socketID to the session
  cookie: {
    secure: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiesecure
    httpOnly: true, // Hides cookie from javascript, details : https://www.npmjs.com/package/express-session#cookiehttponly
    sameSite: false, // Required setting for making this work cross-browser with client on different host, see: https://www.npmjs.com/package/express-session#cookiesamesite
  },
  store: MongoStore.create({ 
    mongoUrl: process.env.DATABASE_URI
  })
});

app.use(sessionMiddleware)
payload.io.engine.use(sessionMiddleware)


httpServer.listen(process.env.PORT || 3000)


export const start = async (args?: Partial<InitOptions>) => {  
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app, // Adding Express instance
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
    ...(args || {}),
  })
  
  app.get('/', (_, res) => {
    res.redirect('/admin')
  })

  ;
}

start()
