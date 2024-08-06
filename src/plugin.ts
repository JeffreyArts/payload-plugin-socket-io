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

      config.globals = [
        ...(config.globals || []),
        // Add additional globals here
      ]

      if (config.collections && config.collections.length > 1) {
        config.collections.map(collection => {
          if (collection?.custom?.socketAccess) {
            const socketAccess = collection.custom.socketAccess
            
            for (const type in socketAccess) {
              
              console.log("Create new socket hook for:", `${collection.slug}.${type}`);
              if (socketAccess[type] === false) {
                break;
              }
              
              if (typeof socketAccess[type] !== "function") {
                break;
              }
              
              const newHook : CollectionAfterOperationHook = ({
                args, // arguments passed into the operation
                operation, // name of the operation
                req, // full express request
                result, // the result of the operation, before modifications
              }) => {
                let data = undefined
                // console.log("Req.payload", req.payload)
                if (operation !== type) {
                  return
                }
                
                if (!io) {
                  throw new Error("Internal error: Missing io object")
                }

                
                // if (!req.res?.socket) {
                //   throw new Error("Internal error: Missing socket")
                // }
                
                const socketID = req.session.socketID
                const socket = io.sockets.sockets.get(socketID)
                const authenticated = !!req.user
                
                console.log("req.session", req.session)
                console.log("io.sockets", )
                
                // Process socketaccess method
                if (typeof socketAccess[type] === "function") { 
                  data = socketAccess[type](args, req, result)
                }
                
                if (data === false) {
                  return data
                }
                
                if (data !== undefined) {
                  result = data
                }
                
                // Method processed, now emit socket(s)
                
                // Process public emit
                if (io) {
                  let publicData = data
                  if (data["public"]) {
                    publicData = data["public"]
                  }
                  io.emit(`public.${collection.slug}.${type}`, publicData)
                }
                  
                
                // Process self emit
                if (io) {
                  if (!socket) {
                    throw new Error(`Can't emit to self; missing socket for id ${socketID}`)
                  }
                  
                  let tmpResult = result
                  if (result["self"]) {
                    tmpResult = result["self"]
                  }
                  socket.emit(`self.${collection.slug}.${type}`, tmpResult)
                }
                
                
                // Process room emit
                if (io && (!result.id)) {
                  
                  for (const room in result) {
                    if (room == "public" || room == "self") {
                      break;
                    }
                    let tmpResult = result
                    if (result[room]) {
                      tmpResult = result[room]
                    }

                  // console.log("⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴⎴");
                  // console.log(`io.to(${room}).emit(${room}.${collection.slug}.${type}, ${JSON.stringify(tmpResult, null, 2)}`)
                  // console.log("⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵⎵");
              
                    io.to(room).emit(`${room}.${collection.slug}.${type}`,tmpResult)
                  }
                }
    
                // console.log("req.payload.io", typeof req.payload.io)
                
                // return undefined to respect the original request result over the modified socket one
    
                if (result["self"]) {
                  return result["self"]
                }
    
                if (result["public"]) {
                  return result["public"]
                }
    
                return result
              }
              
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
