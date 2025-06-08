import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MongoAdapter as Database } from '@builderbot/database-mongo'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import * as dotenv from 'dotenv'
import { ClienteController } from './controller/cliente-controller.js'


dotenv.config()

const PORT = process.env.PORT ?? 3008


// --- FLUJO DE CANJE DINÁMICO ---

// 1. Flow que procesa el canje de cualquier producto seleccionado
const canjeProductoFlow = addKeyword(['']) // No ponemos palabras clave, se activa por selección de producto
  .addAnswer('Procesando canje...', null, 
    async (ctx, { flowDynamic, gotoFlow }) => {
      // El ID del producto seleccionado llega en ctx.body (ajusta si tu provider lo envía en otro campo)
      const productoId = ctx.body;

      // Buscamos el producto en MongoDB usando el controlador
      const producto = await ClienteController.getProductoById(productoId);
      if (producto.error) {
        await flowDynamic(`Error en sistema - Intente mas tarde.`);
        return gotoFlow(escapeActionFlow); 
      }

      // Procesamos el canje con los datos del producto
      let processCanje = await ClienteController.processCanje(ctx.from, producto.puntos, producto.title);
      if (processCanje.error) {
        await flowDynamic(`${processCanje.error}`);
      } else {
        await flowDynamic(`Tu codigo de canje es: *${processCanje.code}* - Presenta este codigo en nuestra sucursal y obtene tu premio.`);
      }
      return gotoFlow(escapeActionFlow); 
    }
  )

// 2. Flow que muestra la lista dinámica de productos de canje
const canjearFlow = addKeyword(['Canjear Producto']).addAnswer(
  'Aquí tienes los productos disponibles para canjear:',
  null,
  async (ctx, { provider, flowDynamic, gotoFlow }) => {
    const productsToRedeem = await ClienteController.getProducts();

    if (!Array.isArray(productsToRedeem) || productsToRedeem.length === 0) {
      await flowDynamic('No hay productos disponibles para canjear en este momento.');
      return gotoFlow(escapeActionFlow); // O flow que quieras para salir o menú
    }

    // Validar que cada producto tenga id y title
    const rows = productsToRedeem.map(p => ({
      id: p._id.toString(),
      title: p.title || 'Sin título',
      description: `${p.description || ''} - Coste: ${p.puntos} puntos`
    }));

    const sections = [{
      title: 'Productos Disponibles',
      rows: rows.slice(0, 10) // Limitar máximo 10 filas por sección
    }];

    const listMessage = {
      header: { type: "text", text: "Elige tu recompensa" },
      body: { text: "Selecciona el producto que te gustaría canjear de la lista a continuación:" },
      footer: { text: "Gracias por elegirnos!" },
      action: { button: "Ver Productos", sections }
    };

    await provider.sendList(ctx.from, listMessage);
  },
  [canjeProductoFlow]
);


//Consutla de puntos
const puntosFlow = addKeyword(['Consultar Puntos']).addAnswer('Consultando puntos...', null,
    async (ctx, {flowDynamic}) => {
        let puntos = await ClienteController.getPuntos(ctx.from)
        if(puntos.error){
           await flowDynamic(`${puntos.error}`)
        }else{
            if(puntos.nuevo){
                await flowDynamic(`Has sido registrado como usuario, nos alegra mucho! Por eso te regalamos: *10* puntos para canjear.`)
            }else{
                await flowDynamic(`Tienes *${puntos.puntos}* disponibles`)
            }
        }
    }
).addAction(async (ctx, { gotoFlow }) => {
    return gotoFlow(escapeActionFlow)
})





/* 
// LISTA CANJEAR PRODUCTOS
const canjearFlow = addKeyword(['Canjear Producto']).addAnswer(
    'Aquí tienes los productos disponibles para canjear:',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'PROD_1_ID_CANJE', title: 'Helado 1 bocha', description: 'Canjea por 50 puntos' },
            { id: 'PROD_2_ID_CANJE', title: 'Desayuno simple', description: '(Cafe + Medialuna) Canjea por 25 puntos' },
            { id: 'PROD_3_ID_CANJE', title: 'Porcion Torta', description: '(Pistacho o Cheeskake) Canjea por 75 puntos' }
        ];
        const sections = [{
            title: 'Productos Disponibles',
            rows: productsToRedeem.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description
            }))
        }];
        const listMessage = {
            header: { type: "text", text: "Elige tu recompensa" },
            body: { text: "Selecciona el producto que te gustaría canjear de la lista a continuación:" },
            footer:{ text:"Gracias!" },
            action: { button: "Ver Productos", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [prod1Flow, prod2Flow, prod3Flow]
)
 */


/* Opciones */
const rtaRecomendacionesFlow = addKeyword(['PROD_1_PN','PROD_2_PN','PROD_3_PN','PROD_1_HS','PROD_2_HS','PROD_3_HS','PROD_1_TS','PROD_2_TS','PROD_3_TS'])
    .addAnswer('Excelente eleccion! Podes disfrutarlo en nuestra sucursal de *AMORATTO* en: Marcial Candioti 3500, Santa Fe')
    .addAction(async (ctx, { gotoFlow }) => {
    return gotoFlow(escapeActionFlow)
})



const opnPanaderiaFlow = addKeyword(['Panaderia']).addAnswer(
    'Aquí tienes opciones de nuestros mejores productos de panaderia',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'PROD_1_PN', title: 'Facturas surtidas', description: '$ 8.500 -' },
            { id: 'PROD_2_PN', title: 'Medialunas de manteca', description: '$ 3.500 -' },
            { id: 'PROD_3_PN', title: 'Alfajores', description: '$ 2.500 - c/u' }
        ];
        const sections = [{
            title: '-',
            rows: productsToRedeem.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description
            }))
        }];
        const listMessage = {
            header: { type: "text", text: "Aqui van nuestras recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Recomendaciones", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaRecomendacionesFlow]
)

const opnTortasFlow = addKeyword(['Tortas']).addAnswer(
    'Aquí tienes opciones de nuestras tortas',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'PROD_1_TS', title: 'Torta de pistacho', description: '$ 8.500 - xPorcion' },
            { id: 'PROD_2_TS', title: 'Cheescake FrutosRojos', description: '$ 5.500 - xPorcion' },
            { id: 'PROD_3_TS', title: 'Torta Oreo', description: '$ 9.500 - xPorcion' }
        ];
        const sections = [{
            title: '-',
            rows: productsToRedeem.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description
            }))
        }];
        const listMessage = {
            header: { type: "text", text: "Aqui van nuestras recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Recomendaciones", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaRecomendacionesFlow]
)

const opnHeladosFlow = addKeyword(['Helados']).addAnswer(
    'Aquí tienes nuestras recomendaciones de Helados',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'PROD_1_HS', title: 'Helado 2 bochas', description: '$ 3.500 - ' },
            { id: 'PROD_2_HS', title: '1/4 kg', description: '$ 7.500 - ' },
            { id: 'PROD_3_HS', title: '1 kg', description: '$ 13.500 - ' }
        ];
        const sections = [{
            title: '-',
            rows: productsToRedeem.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description
            }))
        }];
        const listMessage = {
            header: { type: "text", text: "Aqui van nuestras recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Recomendaciones", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaRecomendacionesFlow]
)





/* Carta y recomendaciones */

const cartaYrecomendacionesFlow = addKeyword(['Carta y Recomen.'])
.addAnswer('Nuestras recomendaciones y una muestra de nuestro amplia carta. - Que te interesa?', {
    capture:true,
    buttons: [
        {
            body:'Helados',
        },
        {
            body: 'Tortas'
        },
        {
            body: 'Panaderia'
        }
    ]
}, null, [opnPanaderiaFlow, opnHeladosFlow, opnTortasFlow]
)











//Menu de opciones
const menuPpalFlow = addKeyword(['Menu principal', 'Si, soy cliente.']).addAnswer('Que queres hacer hoy!', {
    capture:true,
    buttons: [
        {body: 'Consultar Puntos'},
        {body: 'Canjear Producto'},
        {body: 'Carta y Recomen.'}
    ]
}, null, [puntosFlow, canjearFlow , cartaYrecomendacionesFlow])





// REGISTRAR CLIENTES

const registerManualFlow = addKeyword(['No lo soy.']).addAnswer('Lo estamos registrando como cliente...', null,
    async (ctx, {flowDynamic}) => {
        let puntos = await ClienteController.getPuntos(ctx.from)
        if(puntos.error){
            await flowDynamic(`${puntos.error}`)
        }else{
            if(puntos.nuevo){
                await flowDynamic(`Has sido registrado como cliente, nos alegra mucho! Por eso te regalamos: *10* puntos para canjear.`)
            }else{
                await flowDynamic(`Tienes *${puntos.puntos}* disponibles`)
            }
        }
    }
).addAction(async (ctx, { gotoFlow }) => {
    return gotoFlow(menuPpalFlow)
})





//Bienvenida

const welcomeFlow = addKeyword(['hi', 'hello', 'hola', 'Volver al inicio', 'buenas']).addAnswer(`🙌 Hola! Bienvenido a *AMORATTO*`).addAnswer(
    'Sos cliente ?',
    {
        capture:true,
        buttons:[
            {body: 'Si, soy cliente.'},
            {body: 'No lo soy.'},
        ]
    },
    null,
    [registerManualFlow, menuPpalFlow]
)


//Despedida
const exitFlow = addKeyword(['Salir'])
    .addAnswer('Que tengas buen dia! Espero vuelvas pronto. 👋')



    
//Intermedio salida a acciones
const escapeActionFlow = addKeyword(['exitAction'])
.addAnswer('Quieres hacer algo mas hoy?', {
    capture:true,
    buttons: [
        {
            body: 'Menu principal'
        },
        {   
            body: 'Salir'
        }

    ]
}, null, [menuPpalFlow,exitFlow])


const fallbackFlow = addKeyword(['']).addAnswer('No entiendo su mensaje, escriba *hola* para comenzar.')


const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW'))
    .addAnswer(`What is your name?`, { capture: true }, async (ctx, { state }) => {
        await state.update({ name: ctx.body })
    })
    .addAnswer('What is your age?', { capture: true }, async (ctx, { state }) => {
        await state.update({ age: ctx.body })
    })
    .addAction(async (_, { flowDynamic, state }) => {
        await flowDynamic(`${state.get('name')}, thanks for your information!: Your age: ${state.get('age')}`)
    })

const fullSamplesFlow = addKeyword(['samples', utils.setEvent('SAMPLES')])
    .addAnswer(`💪 I'll send you a lot files...`)
    .addAnswer(`Send image from Local`, { media: join(process.cwd(), 'assets', 'sample.png') })
    .addAnswer(`Send video from URL`, {
        media: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJ0ZGdjd2syeXAwMjQ4aWdkcW04OWlqcXI3Ynh1ODkwZ25zZWZ1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LCohAb657pSdHv0Q5h/giphy.mp4',
    })
    .addAnswer(`Send audio from URL`, { media: 'https://cdn.freesound.org/previews/728/728142_11861866-lq.mp3' })
    .addAnswer(`Send file from URL`, {
        media: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    })

export const main = async () => {
    
    try {
       
       const adapterFlow = createFlow([welcomeFlow, registerFlow, fullSamplesFlow, fallbackFlow])
       const adapterProvider = createProvider(Provider, {
           jwtToken: process.env.TOKEN_ACCESS,
           numberId: process.env.NUMBER_ID,
           verifyToken: process.env.VERIFY_TOKEN,
           version: 'v22.0'
        })
    const adapterDB = new Database({
        dbUri: process.env.MONGO_DB_URI,
        dbName: process.env.MONGO_DB_NAME,
    })

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )
    

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )


    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)

    
} catch (error) {
    console.log('ERROR INTERNO CRITICO', error.message)
    process.exit(1)
}
}
