import { engine } from 'express-handlebars'
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

import { router as adminRoutes } from './router/admin.routes.js'
import { connectMongo, disconnectMongo } from './db-singleton.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.API_PORT || 3000;

await connectMongo();

const app = express();

app.use(express.json()); 
app.use(cookieParser(process.env.SIGN_COOKIE));
app.use(express.static(path.join(__dirname, 'public')));



app.engine('handlebars', engine({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
}))
app.set('view engine', 'handlebars')
app.set('views', __dirname + '/views')

app.use('/', adminRoutes);

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});

// 5. Cleanup
process.on('SIGINT', async () => {
  console.log('Cerrando proceso...');
  await disconnectMongo();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Terminando proceso...');
  await disconnectMongo();
  process.exit(0);
});
