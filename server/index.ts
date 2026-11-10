import "dotenv/config"
import { app } from "./routes/contact.ts"

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 3001
  app.listen(port, () => {
    console.log(`Contact API listening on :${port} (env: ${process.env.APP_ENV ?? "development"})`)
  })
}
