import { InitOptions } from 'payload/config'
import payload from "payload";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import session from "express-session";
import MongoStore from "connect-mongo"
import "dotenv/config"
import cors from "./utils/loadCorsFromENV"

const port = process.env.PORT || 3000;

const app = express();
app.set('trust proxy', 1)

const httpServer = createServer(app);

const sessionMiddleware = session({
  secret: "changeit",
  resave: false, // Required in current set-up, see for details: https://www.npmjs.com/package/express-session#resave
  saveUninitialized: true, // Unsure if this is mandatory
  cookie: {
      secure: false, // Unsure if this is mandatory
      httpOnly: false, // Unsure if this is mandatory
      sameSite: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiesamesite
  },
  store: MongoStore.create({ // A store is required to use to prevent memory leaks, Mongostore is just used because mongoDB was already included 
    mongoUrl: process.env.DATABASE_URI
  })
});


export const start = async (args?: Partial<InitOptions>) => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
    ...(args || {}),
  })

  // Add your own express routes here

  app.use(sessionMiddleware); // Initiate this before initialization of payload


  const io = new Server(httpServer,
    {
      cors: {
        origin: cors,
        methods: ["GET", "POST"],
        credentials: true // This property is required to maintain sessionId's
      }
    }
  );
  
  io.engine.use(sessionMiddleware);
  
  // Redirect root to Admin panel
  app.get('/', (_, res) => {
    res.redirect('/admin')
  })

  httpServer.listen(port, () => {
    console.log(`application is running at: http://localhost:${port}`);
  });
  

  io.on("connect", (socket) => {
    // Add socketID to session
    console.log("On connect", !!socket.request.session)
    if (socket.request.session) {
      socket.request.session.socketID = socket.id
      socket.request.session.save()
    }
    
    const sessionId = socket.request.sessionID;
    // const sessionId = socket.request.session;
    // socket.join(sessionId)
    console.log("Socket sessionId:", sessionId, socket.request.session)
    
    socket.on("disconnect", () => {
      // Remove socketID from connection when disconnected
      delete socket.request.session.socketID
      socket.request.session.save()
    })
  })
  
  app.get('/api/test', (req, res) => {
    console.log("Test sessionId:", req.sessionID, req.session)
    res.send('hello world')
  })
}

start()
