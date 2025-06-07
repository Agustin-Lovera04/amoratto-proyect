import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import {engine} from 'express-handlebars'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'

import {router as adminRoutes} from './api/router/admin.routes.js'
import { connectMongo, disconnectMongo } from './db-singleton.js'
import { main } from './app.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const PORT = process.env.API_PORT || 3000

await connectMongo()

const app = express()

app.use(express.json())

app.use(express.static(__dirname + '/public'))

app.use(cookieParser(process.env.SIGN_COOKIE))



//declara y inicializa el motor

app.engine('handlebars', engine({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
}))

app.set('view engine', 'handlebars')//setea el motor de vistas
app.set('views', __dirname + '/views')//donde se encontraran las vistas




// Rutas para el panel admin
app.use('/', adminRoutes)


app.listen(PORT, () => {
  console.log(`Admin corriendo en http://localhost:${PORT}/admin`)
})


// Iniciar el bot por separado
main().then(() => {
  console.log('Bot iniciado correctamente.')
}).catch(err => {
  console.error('Error iniciando el bot:', err.message)
})

// Cleanup
process.on('SIGINT', async () => {
  console.log('Cerrando proceso...')
  await disconnectMongo()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Terminando proceso...')
  await disconnectMongo()
  process.exit(0)
})
