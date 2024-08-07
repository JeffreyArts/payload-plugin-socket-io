import express from "express";
import { createServer } from "node:http";
import type { ServerOptions } from "engine.io";
import { Server, Socket} from "socket.io";
import session, { SessionOptions } from "express-session";
import { SessionIncomingMessage } from "./../types";

type initiateExpressSocketIOtype = {
    onConnect?: Array<(socket: Socket) => void>,
    socketIO: ServerOptions,
    expressSession : SessionOptions
}

export default (port = 3000, options: initiateExpressSocketIOtype) => {
    const defaultOptions = {
        onConnect: (socket) => {
            const request = socket.request as SessionIncomingMessage
            // Add socketID to session on connection
            if (request.session) {
                request.session.socketID = socket.id
                request.session.save()
    
                // Add sessionID to socket
                socket.sessionID = request.sessionID;
            }
        },
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
        onConnect: [defaultOptions.onConnect],
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
    } as initiateExpressSocketIOtype

    if (options.onConnect && typeof opts.onConnect != "undefined" && typeof opts.onConnect != "function") {
        if (typeof options.onConnect === "function") {
            opts.onConnect.push(options.onConnect)
        } else {
            options.onConnect.forEach(onConnect => {
                if (opts.onConnect) {
                    opts.onConnect.push(onConnect)
                }
            })
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
        if (opts.onConnect) {
            opts.onConnect.forEach(onConnect => onConnect(socket))
        }
    })

    return {
        io,
        express: app,
        httpServer: httpServer
    }
}
