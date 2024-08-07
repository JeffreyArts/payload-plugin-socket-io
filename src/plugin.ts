import { CollectionAfterOperationHook } from 'payload/types'
import type { Config, Plugin } from 'payload/config'
import type { Server } from "socket.io"

import type { PluginTypes } from './types'

type PluginType = (pluginOptions: PluginTypes) => Plugin

export const PluginSocketIO =
  (pluginOptions: PluginTypes): Plugin =>
    (incomingConfig) => {
      let config = { ...incomingConfig }
      let io = undefined as undefined | Server

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
              
              console.info("Create new socket hook for:", `${collection.slug}.${socketAccessType}`);
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
                  resolve(result)
                  throw new Error("Internal error: Missing session object")
                }

                const socketID = req.session.socketID
                const socket = io.sockets.sockets.get(socketID)
                

                // Method processed, now emit socket(s)
                // `Public` emit
                if (io && data["public"]) {
                  io.emit(`public.${collection.slug}.${operation}`, data["public"])
                }
                
                // `Self` emit
                if (io && data["self"]) {
                  if (!socket) {
                    return reject(new Error(`Can't emit to self; missing socket for id ${socketID}`))
                  }
                  socket.emit(`self.${collection.slug}.${operation}`, data["self"])
                }
                
                // `<room>` emit
                if (io && (!data.id)) {
                  for (const room in data) {
                    if (room == "public" || room == "self") {
                      continue;
                    }
                    // console.log("⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴");
                    // console.log(`io.to(${room}).emit(${room}.${collection.slug}.${operation}, ${JSON.stringify(roomData, null, 2)}`)
                    // console.log("⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵");
                    const roomData = data[room]
                    io.to(room).emit(`${room}.${collection.slug}.${operation}`,roomData)
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
      }
      return config
    }
