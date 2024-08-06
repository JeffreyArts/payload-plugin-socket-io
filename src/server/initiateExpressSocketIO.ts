import express from "express";
import { createServer } from "node:http";
import type { ServerOptions } from "engine.io";
import { Server } from "socket.io";
import session, { SessionOptions } from "express-session";
import { SessionIncomingMessage } from "./../types";

export default (port = 3000, options = {
    socketIO: {
        cors: {
            origin: "localhost*",
            methods: ["GET", "POST"],
            credentials: true // This property is required to maintain sessionId's
        }
    } as ServerOptions,
    expressSession: {
        resave: false, // Required in current set-up, see for details: https://www.npmjs.com/package/express-session#resave
        saveUninitialized: true, // Unsure if this is mandatory
        cookie: {
            secure: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiesecure
            httpOnly: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiehttponly
            sameSite: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiesamesite
        },
    } as SessionOptions
}) => {

    const defaultOptions = {
        socketIO: {
            cors: {
                methods: ["GET", "POST"],
                credentials: true // This property is required to maintain sessionId's
            }
        },
        expressSession: {
            resave: false, // Required in current set-up, see for details: https://www.npmjs.com/package/express-session#resave
            saveUninitialized: true, // Unsure if this is mandatory
            cookie: {
                secure: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiesecure
                httpOnly: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiehttponly
                sameSite: false, // Required for localhost development, for production see: https://www.npmjs.com/package/express-session#cookiesamesite
            },
        }
    }

    const opts = {
        socketIO: {
            ...defaultOptions.socketIO,
            ...options.socketIO,
            cors: {
                ...defaultOptions.socketIO.cors,
                ...options.socketIO.cors
            },
        },
        expressSession: {
            ...defaultOptions.expressSession,
            ...options.expressSession,
            cookie: {
                ...defaultOptions.expressSession.cookie,
                ...options.expressSession.cookie,
            }
        }
    }

    const app = express();
    app.set('trust proxy', 1)
    
    const sessionMiddleware = session(opts.expressSession);
    
    const httpServer = createServer(app);
    
    app.use(sessionMiddleware);
    
    
    const io = new Server(httpServer, opts.socketIO);
      
    io.engine.use(sessionMiddleware);
    
    httpServer.listen(port);

    io.on("connect", (socket) => {
        const request = socket.request as SessionIncomingMessage
        // Add socketID to session on connection
        if (request.session) {
            request.session.socketID = socket.id
            request.session.save()

            // Add sessionID to socket
            socket.sessionID = request.sessionID;
        }
    })
    return {
        io,
        express: app,
        httpServer: httpServer
    }
}
