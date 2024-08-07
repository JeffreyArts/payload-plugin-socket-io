import { CollectionConfig } from "payload/types"
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
                // Return {self: boolean | Object<result>}
                // Return {<room>: boolean | Object<result>}
                
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
                    self: result,
                    admin: {
                        newMessage: true
                    }
                }
            },
            updateByID: {
                self: true,
                public: true,
                messages: true
            }
        } 
    },
    fields: [
        {
            name: "user",
            type: "relationship",
            relationTo: "site-users",
            label: "User",
            defaultValue: (req) =>  req.user,
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
