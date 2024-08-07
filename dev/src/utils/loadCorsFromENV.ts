// import "dotenv/config"

let cors = [] as Array<string>
if (process.env.CORS) {
    if (process.env.CORS === "*") {
        cors.push(process.env.CORS)
    } else { 
        process.env.CORS.split(",").map(v => {
            if (typeof v === "string" && typeof cors === "object") {
                cors.push(v)
            }
        })
    }
}

export default cors