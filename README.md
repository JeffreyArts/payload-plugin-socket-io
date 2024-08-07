# Payload plugin - Socket IO
#### Plugin for integrating Socket IO with payload

This plugin will allow you to emit messages via SocketIO on Payload’s crud operations over the root/default namespace. It works by adding a custom.socketAccess object to your collection with one of the following properties: ‘create', ‘find', ‘findByID’, ‘update', ‘updateByID’, ‘delete’, ‘deleteByID’, ‘login’, ‘refresh’, and or ‘forgotPassword’.It will utilise express-session to extend sockets with a session object, that can be used via back-end processes. The socketIO server and express session need to be set-up by the developer. This document guides you through this process, and highlights common pitfalls.

This plugin also allows to send/receive custom messages over sockets, outside of payloads integration, and can be tested by going to the /dev/src folder and run `yarn dev`. Don’t forget to install the packages in the root as well as the /dev directories


## Installation

### Step 1 Add this project in you plugins directory

Clone this project in you plugins directory (there is no rpm install available yet). If you don’t have a plugins folder, I’ll suggest to create one on the root level of your application. 

### Step 2 Configure server

This is the most complex step, but in short, you can copy+paste the code below to initiate an express & socketIO server that utilises the express-session middleware that is required for this plugin to work. The longer version is going through it line by line and weave it in your existing server script, since this code only sets up the server, it does not initialise payload.


```
import express from 'express';
import { createServer } from "node:http";
import { Server } from "socket.io"
import session, { SessionOptions } from "express-session";
import MongoStore from "connect-mongo"

const app = express();
app.set('trust proxy', 1)

const httpServer = createServer(app);
// Adding socketIO server to payload object, so it is accessible from any point in the application
payload.io = new Server(httpServer, {
  cors: {
    origin: [“http://localhost:3000”], // Array of authorized hosts
    methods: ["GET", "POST"], // Required setting
    credentials: true // This property is required when server host differs from client host eg. http://localhost:3000 VS http://localhost:3001
  }
});

const sessionMiddleware = session({
  secret: process.env.PAYLOAD_SECRET, // Replace with 24 characters+ random string if .env not available
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
```


and include it according [Payload’s specs](https://payloadcms.com/docs/configuration/overview) in your payload configuration.
```
import { buildConfig } from ‘payload/config'
import { PluginSocketIO } from ‘./plugins/PluginSocketIO‘buildConfig({	…
	plugins: [ PluginSocketIO ]})
```


### Step 3 Load plugin
The third and final step, is to it according [Payload’s specs](https://payloadcms.com/docs/configuration/overview) in your payload configuration.
```
import { buildConfig } from ‘payload/config'
import { PluginSocketIO } from ‘./plugins/PluginSocketIO‘buildConfig({	…
	plugins: [ 
		PluginSocketIO({
			enabled: true		})
	]})
```


## Use cases

Before going through the use cases, I’d like to mention that you can pass a `dev` attribute into the plugin configuration object to provide console logs of emitted messages. This could help your configuration when the server-client connection has not yet been successfully established.
### 1. Emit messages on CRUD operations

You can emit messages when certain operations are being executed on your collections. Any of these operations can be used to emit messages: ‘create', ‘find', ‘findByID’, ‘update', ‘updateByID’, ‘delete’, ‘deleteByID’, ‘login’, ‘refresh’, and or ‘forgotPassword’Simply extend your collection config via one of these two methods:



```
CollectionConfig = {
	custom: {
		socketAccess: {
			create: (args, req, result) => {
				// Return false to disallow emit
				// Return {public: boolean | Object<result>}
				// Return {self: boolean | Object<result>}
				// Return {<room>: boolean | Object<result>}
				const publicMessage = {…result}
				publicMessage.hello = “world”
				return {
          public: result,
          self: true,
          lorem: ”ipsum”
        }
      }
		}
	}
}

```This configuration will emit the result with the extended property “hello” to everyone who is connected with the server. It wil simultaneously send a message to the user that created the new entry with the value equal to the body of its POST request. It will also emit the string “ipsum” to any user that is connected to the “lorem” room.

```
CollectionConfig = {
	custom: {
		socketAccess: {
			updateByID: {
        public: true,
        self: true,
        lorem: ”ipsum”
      }
		}
	}
}
```
This configuration will do almost the same as the previous one, except it won’t extend the result object for the public message. 

### 2. Add custom server emitters

In order to allow your server to process client messages, you can create custom functions that will be executed on the initialisation of the connection. Below you’ll find a simple example that would allow a client to emit a string to “mario-luigi”, to join either the Mario or Luigi room.
```
const customRoutes = (socket: Socket) => {
    socket.on(“mario-luigi", data => {
       if (data.toLowerCase() === “mario”) {
            socket.join(“mario”)
        }
       if (data.toLowerCase() === “luigi”) {
            socket.join(“luigi”)
        }
    })
}


```After creating this function, you’ll need to pass it to the PluginSocketIO configuration like so:buildConfig({	…
	plugins: [ 
		PluginSocketIO({
			onConnect: [customRoutes]
    })
	]})
```
This method could be used for any other use case as well, that requires to process a socket right after initialisation. This use case is just an example.


## Client configuration

The client configuration is pretty straight forward, and well documenten on the [socket.io website](https://socket.io/docs/v4/client-api/). There are however two configuration properties that you might want to take a closer look on, `secure` & `withCredentials`, especially when you are running your client from a different host as your server.
