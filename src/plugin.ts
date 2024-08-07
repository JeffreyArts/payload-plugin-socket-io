import { CollectionAfterOperationHook } from 'payload/types'
import type { Plugin } from 'payload/config'
import type { Server, Socket } from "socket.io"
  
import type { OptionsPluginSocketIO, CustomSession, CustomSocket, CustomSocketRequest } from './types'

// type PluginType = (pluginOptions: PluginType) => Plugin

export const PluginSocketIO =
(pluginOptions: OptionsPluginSocketIO): Plugin =>
  (incomingConfig) => {
  let config = { ...incomingConfig }
  let io = undefined as undefined | Server
  const dev = !!pluginOptions.dev

  
  // If the plugin is disabled, return the config without modifying it
  // The order of this check is important, we still want any webpack extensions to be applied even if the plugin is disabled
  if (pluginOptions.enabled === false) {
    return config
  }
  
  if (config.collections && config.collections.length > 1) {
    config.collections.map(collection => {
      if (collection?.custom?.socketAccess) {
        const socketAccess = collection.custom.socketAccess
        
        for (const socketAccessType in socketAccess) {
          
          if (dev) {
            console.info("Create new socket hook for:", `${collection.slug}.${socketAccessType}`);
          }
          if (socketAccess[socketAccessType] === false) {
            break;
          }
          
          if (typeof socketAccess[socketAccessType] !== "function") {
            break;
          }
          
          const newHook : CollectionAfterOperationHook = ({
            args, // arguments passed into the operation
            operation, // name of the operation
            req, // full express request
            result, // the result of the operation, before modifications
          }) => new Promise((resolve,reject) => {
            /**
            * data = {
            *  public?: {}
            *  self?: {}
            *  <room>: {}
            * }
            */
            let data = {} as {
              public?: any
              self?: any
              [key: string]: any
            }
            
            // Process socketaccess method
            if (typeof socketAccess[operation] === "function") { 
              data = socketAccess[operation](args, req, result)
            }
            
            if (typeof socketAccess[operation] === "object") { 
              for (const accessType in socketAccess[operation]) {
                if (socketAccess[operation][accessType]) {
                  data[accessType] = result
                }
              }
            }

            
            // Escape hook, since the data property indicates that it is not allowed to emit messages
            if (!data) {
              return resolve(result)
            }

            
            // Escape hook, since it can't emit any messages
            if (!io) {
              resolve(result)
              throw new Error("Internal error: Missing io object")
            }

            
            // Escape hook, since the session object is mandatory
            if (!req.session) {
              // reject(new Error("Internal error: Missing session object"))
              throw new Error("Internal error: Missing session object")
            }
            

            const session = req.session as CustomSession
            const socketID = session.socketID
            if (!socketID) {
              throw new Error("Internal error: Missing socket id")
            }
            const socket = io.sockets.sockets.get(socketID)
            
            
            // Method processed, now emit socket(s)
            // `Public` emit
            if (io && data["public"]) {

              if (dev) {
                console.log("⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴");
                console.log(`io.emit("public.${collection.slug}.${operation}", ${JSON.stringify(data["public"], null, 2)}`)
                console.log("⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵");
              }
              io.emit(`public.${collection.slug}.${operation}`, data["public"])
            }
            
            // `Self` emit
            if (io && data["self"]) {
              if (!socket) {
                return reject(new Error(`Can't emit to self; missing socket for id ${socketID}`))
              }

              if (dev) {
                console.log("⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴");
                console.log(`socket.emit("self.${collection.slug}.${operation}", ${JSON.stringify(data["self"], null, 2)}`)
                console.log("⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵");
              }
              socket.emit(`self.${collection.slug}.${operation}`, data["self"])
            }
            
            // `<room>` emit
            if (io && (!data.id)) {
              for (const room in data) {
                if (room == "public" || room == "self") {
                  continue;
                }

                if (dev) {
                  console.log("⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴");
                  console.log(`io.to("${room}").emit("${room}.${collection.slug}.${operation}", ${JSON.stringify(data[room], null, 2)}`)
                  console.log("⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵");
                }

                io.to(room).emit(`${room}.${collection.slug}.${operation}`,data[room])
              }
            }
            
            // Disallow socketAccess to intervine with data flow
            return resolve(result)
          })
          
          // Add hook to collection hook
          if (!collection.hooks){
            collection.hooks = {}
          }
          
          if (!collection.hooks.afterOperation){
            collection.hooks.afterOperation = []
          }
          
          collection.hooks.afterOperation.push(newHook)
        }
      }
    })
  }
  
  config.onInit = async payload => {
    io = payload.io

    if (!io) {
      throw new Error("Missing io object on payload instance")
    }
    
    if (!payload.express) {
      throw new Error("Missing express object on payload instance")
    }
    
    // Add socket on connect methods
    const defaultOnConnectMethod = (socket: CustomSocket) => {
      // console.log("socket", socket)
      const request = socket.request as CustomSocketRequest
      // Add socketID to session on connection
      if (request.session) {
        request.session.socketID = socket.id
        request.session.save()
        
        // Add sessionID to socket
        socket.sessionID = request.sessionID;
      }
    }
    
    const onConnectMethods = [defaultOnConnectMethod] as Array<(socket: Socket | CustomSocket ) => void>
    if (pluginOptions.onConnect && typeof pluginOptions.onConnect != "undefined" && typeof pluginOptions.onConnect != "function") {
      if (typeof pluginOptions.onConnect === "function") {
        onConnectMethods.push(pluginOptions.onConnect)
      } else {
        pluginOptions.onConnect.forEach(onConnect => {
          if (onConnectMethods) {
            onConnectMethods.push(onConnect)
          }
        })
      }
      
      io.on("connect", (socket) => {
        if (onConnectMethods) {
          onConnectMethods.forEach(onConnect => onConnect(socket))
        }
      })
    }
  }
  
  return config
}
