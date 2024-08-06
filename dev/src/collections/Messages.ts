import { CollectionConfig } from "payload/types"
// import { SocketAccess } from "@/plugins/my-first-plugin/src/plugin"
import _ from "lodash"  

const Messages: CollectionConfig = {
    slug: "messages",
    access: {
        create: ({req, data}) => {
            // User authentication
            if (!req.user) {
                return false
            }

            // Prefill user with authenticated user id
            if (!data.user) {
                data.user = req.user.id
            }
            return true
        }
    },
    custom: {
        socketAccess: {
            create: (args, req, result) => {
                // Return false to disallow emit
                // Return {public: boolean | Object<result>}
                // Return {authenticated: boolean | Object<result>}
                // Return {<room>: boolean | Object<result>}
                // Return {self: boolean | Object<result>}
                // Return undefined will emit to public by default
                const data = {
                    id: result.id,
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt,
                    text: result.text,
                    user: {
                        id: result.user.id,
                        username: result.user.username
                    }
                }
                return {
                    public: data,
                    self: result
                }
            },
            updateByID: (args, req, result) => {
                console.log("user",result)
                // console.log(req.payload.req.user)
                // Return false to disallow emit
                // Otherwise return undefined, or an adjusted result object
                return {
                    public: result
                }
            }
        } 
    },
    hooks: {
        afterOperation: [
            ({
            args, // arguments passed into the operation
            operation, // name of the operation
            req, // full express request
            result, // the result of the operation, before modifications
          }) => {
            console.log(operation, req.sessionID, req.session)
          }
        ]
    },
    fields: [
        {
            name: "user",
            type: "relationship",
            relationTo: "site-users",
            label: "User",
            required: true
        },
        {
            name:"text",
            type: "text",
            required: true
        }
    ]
}


export default Messages
