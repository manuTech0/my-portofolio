import express, { Request, Response } from "express"
import { createServer as createViteServer } from "vite"
import cors from "cors"
import rateLimit from "express-rate-limit"

async function startApi() {
    const app = express()

    const vite = await createViteServer({
        server: { middlewareMode: true }
    })
    const limiter = rateLimit({
        windowMs: /* 24 * 60 * 60 * 1000 */ 10 * 1000,
        max: 30,
        skip: (req: Request) => {
            return req.path.startsWith("/api/reset")
        },
        message: { error: "Many request" }
    })
    app.use(cors({
        origin: process.env.ALLOW_DOMAIN?.split(", "),
        methods: ["POST"]
    }))
    app.use(limiter)
    app.use(vite.middlewares)

    app.get("/api/message", limiter, (req: Request, res: Response) => {
        res.json({message: "Hello world!" })
    })
    app.get("/api/reset", (req: Request, res: Response) => {
        const ip = req.ip
        res.json({ message: "Succes reset for " + ip })
        // limiter.resetKey(ip || "")
    })

    app.listen(3000, () => {
        console.log("Sever API running at 3000")
    })
}
startApi()