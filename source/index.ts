
import Express from "express"
import { MongoClient } from "mongodb"

import { Request, Response } from "express"
import cookieParser from "cookie-parser"
import session from "express-session"
import bodyParser from "body-parser"

import { sessionSecret, linkHost, projRoot, allowUA } from "./secret"

const app = Express()

function randomString(){
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function main(){

    
    const db = await MongoClient.connect("mongodb://localhost:27017/")
    const dbo = db.db("discord_embed")


    app.get("/e/:id", async (req: Request, res: Response) => {
        var r = await dbo.collection("embeds").findOne({id: req.params.id})
        if (!r) {
            r = {title: "Embed not found", description: "https://www.github.com/MetaMuffin/discord-custom-embeds"}
        }
        res.send(`<!doctype html><html><head>
            <title>${r.title}</title>
            <meta name="theme-color" content="${r.color}" />
            <meta name="description" content="${r.description}" />
            </head><body><p>Hier ist nichts!</p>
            <script>
                window.document.head.innerHTML = "";
                window.document.title = "Hier ist nichts";
                document.body.removeChild(document.body.children[1]);
            </script></body></html>`)
    })

    app.use((req: Request, res: Response, next) => {
        console.log(`UA: ${req.headers["user-agent"]}`);  
        
        if (req.headers["user-agent"]?.search(allowUA) == -1) {
            res.send("Nicht für dich, kek.")
        } else {
            next();
        }
    })

    app.use(cookieParser())
    app.use(session({secret: sessionSecret}))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    app.get("/", (req: Request, res: Response) => {
        res.sendFile(`${projRoot}/public/index.html`)
    })
    app.use("/static",Express.static(`${projRoot}/public`))

    app.post("/create", async (req: Request, res: Response) => {
        var idg = randomString()
        while (await dbo.collection("embeds").findOne({id: idg})) idg = randomString()
        await dbo.collection("embeds").insertOne({
            id: idg,
            title: req.body.title || "No Title provided",
            description: req.body.description || " ",
            color: req.body.color || "#101010"
        })
        var link = `http://${linkHost}/e/${idg}`
        res.send(`<!doctype html><html><head></head><body><p id="link">${link}</p></body></html>`)
    })
    
    app.listen(5565,() => {
        console.log("Server is running...")
    })
}

main()