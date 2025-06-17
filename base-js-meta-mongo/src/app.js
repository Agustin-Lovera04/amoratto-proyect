import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MongoAdapter as Database } from '@builderbot/database-mongo'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import * as dotenv from 'dotenv'
import { ClienteController } from './controller/cliente-controller.js'
import { connectMongo } from './db-singleton.js'

dotenv.config()

const PORT = process.env.PORT ?? 3008

// --- FLUJO DE CANJE DINÁMICO ---

const canjeProductoFlow = addKeyword([]) // No ponemos palabras clave, se activa por selección de producto
  .addAnswer('Un momento, estamos procesando tu canje...', null, 
    async (ctx, { flowDynamic, gotoFlow }) => {
      // El ID del producto seleccionado llega en ctx.body (ajusta si tu provider lo envía en otro campo)
      const productoId = ctx.body;

      // Buscamos el producto en MongoDB usando el controlador
      const producto = await ClienteController.getProductoById(productoId);
      if (producto.error) {
        await flowDynamic(`❌Error en sistema - Intente mas tarde.`);
        return gotoFlow(escapeActionFlow); 
      }

      // Procesamos el canje con los datos del producto
      let processCanje = await ClienteController.processCanje(ctx.from, producto.dinero, producto.title);
      if (processCanje.error) {
        await flowDynamic(`❌¡Atención! ${processCanje.error}`);
      } else {
        await flowDynamic(`¡Excelente! 🎉 Tu código de canje es: *${processCanje.code}*. Presentalo en nuestra sucursal y disfrutá de tu premio.`);
      }
      return gotoFlow(escapeActionFlow); 
    }
  )

// 2. Flow que muestra la lista dinámica de productos de canje
const canjearFlow = addKeyword(['Canjear Producto', 'MENU_CANJEAR_PRODUCTO']).addAnswer(
  '¡Genial! Acá te mostramos los productos disponibles para canjear con tu dinero:',
  null,
  async (ctx, { provider, flowDynamic, gotoFlow }) => {
    const productsToRedeem = await ClienteController.getProducts();

    if (!Array.isArray(productsToRedeem) || productsToRedeem.length === 0) {
      await flowDynamic('En este momento no tenemos productos disponibles para canjear. ¡Volvé a consultar pronto para novedades!');
      return gotoFlow(escapeActionFlow); // O flow que quieras para salir o menú
    }

    // Validar que cada producto tenga id y title
    const rows = productsToRedeem.map(p => ({
      id: p._id.toString(),
      title: p.title || 'Sin título',
      description: `${p.description || ''} - Costo: $ ${p.dinero}.`
    }));

    const sections = [{
      title: '¡Elegí tu recompensa!',
      rows: rows.slice(0, 10) // Limitar máximo 10 filas por sección
    }];

    const listMessage = {
      header: { type: "text", text: "Tus premios te esperan" },
      body: { text: "Seleccioná el producto que más te guste de la lista:" },
      footer: { text: "¡Gracias por ser parte de AMORATTO!" },
      action: { button: "Ver Productos", sections }
    };

    await provider.sendList(ctx.from, listMessage);
  },
  [canjeProductoFlow]
); 

//Consutla de puntos
const dineroFlow = addKeyword(['Consultar Saldo', 'MENU_CONSULTAR_SALDO']).addAnswer('Un segundo, estoy consultando tu saldo ...', null,
    async (ctx, {flowDynamic}) => {
        let dinero = await ClienteController.getDinero(ctx.from)
        if(dinero.error){
           await flowDynamic(`❌No pudimos consultar tu saldo en este momento. Por favor, intentá más tarde.`)
        }else{
            if(dinero.nuevo){
                await flowDynamic(`¡Bienvenido/a! 🎉 Te acabamos de registrar como cliente en *AMORATTO*. ¡Como regalo de bienvenida, tenés *$ 2000*  para empezar a canjear!`)
            }else{
                await flowDynamic(`¡Excelente! Tenés  $ *${dinero.dinero}* disponible para canjear.`)
            }
        }
    }
).addAction(async (ctx, { gotoFlow }) => {
    return gotoFlow(escapeActionFlow)
})

const rtaEscapeFlow = addKeyword(['PAN_1','PAN_2','PAN_3','PAN_4','PAN_5','PAN_6','PAN_7','PAN_8','PAN_9','PAN_10','DUL_1','DUL_2','DUL_3','DUL_4','DUL_5','DUL_6','DUL_7','DUL_8','DUL_9','DUL_10','HEL_1','HEL_2','HEL_3','HEL_4','HEL_5','HEL_6','HEL_7','HEL_8','HEL_9','HEL_10','SAL_1','SAL_2','SAL_3','SAL_4','SAL_5','SAL_6','SAL_7','CAF_1','CAF_2','CAF_3','CAF_4','CAF_5','CAF_6','CAF_7','CAF_8','CAF_9','CAF_10','BEB_1','BEB_2','BEB_3','BEB_4','BEB_5','BEB_6','BEB_7','BEB_8','BEB_9']).addAnswer('Excelente elección! Nuestra carta es mucho mas amplia y tenemos muchas opciones riquisimas para vos! Podes disfrutarlas en nuestra sucursal de *AMORATTO* en: Marcial Candioti 3500, Santa Fe')
    .addAction(async (ctx, { gotoFlow }) => {
    return gotoFlow(escapeActionFlow)})

const opnPanaderiaFlow = addKeyword(['CARTA_PANADERIA']).addAnswer(
    '🥐 Panes y delicias recién horneadas:',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'PAN_1', title: 'Medialuna Manteca', description: '$ 1.000 - Dulce, salada o jamón y queso' },
            { id: 'PAN_2', title: 'Facturas', description: '$ 850/$8.500 - Variedad surtida' },
            { id: 'PAN_3', title: 'Churros', description: '$ 850/$1.000 - Comunes o rellenos' },
            { id: 'PAN_4', title: 'Criollitos Kg', description: '$ 10.000 - Tradicionales' },
            { id: 'PAN_5', title: 'Scones de Queso', description: '$ 2.000/$20.000 - Porción o kilo' },
            { id: 'PAN_6', title: 'Donut', description: '$ 1.500/$15.000 - Individual o docena' },
            { id: 'PAN_7', title: 'Chipá Kg', description: '$ 20.000 - Queso y almidón de mandioca' },
            { id: 'PAN_8', title: 'Bandeja Masas Secas', description: '$ 9.000 - Variedad de masas' },
            { id: 'PAN_9', title: 'Pan Árabe', description: '$ 1.100 - Unidad' },
            { id: 'PAN_10', title: 'Alfajor Maicena/Choc.', description: '$ 1.800/$2.000 - Maicena o chocolate' }
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
            header: { type: "text", text: "Recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Panadería", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaEscapeFlow]
)

const opnDulcesFlow = addKeyword(['CARTA_DULCES']).addAnswer(
    '🍰 Endulza tu día con nuestras tortas y postres:',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'DUL_1', title: 'Torta Ferrero', description: '$ 7.500 - Chocolate y avellanas' },
            { id: 'DUL_2', title: 'Cheese Cake', description: '$ 7.500/8.500/9.500 - Frutos rojos/Oreo/Dulce de leche' },
            { id: 'DUL_3', title: 'Rogel Artesanal', description: '$ 8.500 - Merengue flameado' },
            { id: 'DUL_4', title: 'Red Velvet', description: '$ 7.500 - Bizcocho rojo y queso crema' },
            { id: 'DUL_5', title: 'Chocolina', description: '$ 7.500 - Postre de galletas y chocolate' },
            { id: 'DUL_6', title: 'Torta Matilda', description: '$ 8.500 - Súper chocolatosa' },
            { id: 'DUL_7', title: 'Veneckys Diplomata', description: '$ 2.500 - Postre checo' },
            { id: 'DUL_8', title: 'Torta Cookies Nutella', description: '$ 7.500 - Cookies y Nutella' },
            { id: 'DUL_9', title: 'Brownie Nueces', description: '$ 3.500 - Brownie con nueces' },
            { id: 'DUL_10', title: 'Budín Artesanal', description: '$ 2.600/3.000 - Limón/Naranja/Frutos secos' }
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
            header: { type: "text", text: "Recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Dulces", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },[rtaEscapeFlow]
)
const opnHeladosFlow = addKeyword(['CARTA_HELADOS']).addAnswer(
    '🍦 Disfruta nuestros helados artesanales:',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'HEL_1', title: 'Helado 1/4 kg', description: '$ 6.300 - 250g de helado artesanal' },
            { id: 'HEL_2', title: 'Helado 1 kg', description: '$ 17.000 - 1 kilo, hasta 4 sabores' },
            { id: 'HEL_3', title: 'Conito 1/2/3', description: '$ 4.000/$5.200/$6.000 - Conos chicos y medianos' },
            { id: 'HEL_4', title: 'Capelina', description: '$ 7.000 - Helado con chocolate' },
            { id: 'HEL_5', title: 'Batido', description: '$ 5.800 - Helado batido' },
            { id: 'HEL_6', title: 'Milk Shake', description: '$ 7.000 - Batido de helado' },
            { id: 'HEL_7', title: 'Copa Oreo/Kids', description: '$ 7.500 - Copa especial' },
            { id: 'HEL_8', title: 'Capuccino Helado', description: '$ 7.500 - Café helado' },
            { id: 'HEL_9', title: 'Copa Baileys', description: '$ 7.500 - Helado con licor Baileys' },
            { id: 'HEL_10', title: 'Don Pedro', description: '$ 7.500 - Helado con whisky y nuez' }
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
            header: { type: "text", text: "Recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Helados", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaEscapeFlow]
)

const opnSaladosFlow = addKeyword(['CARTA_SALADOS']).addAnswer(
    '🥪 Aquí tienes nuestras opciones saladas:',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'SAL_1', title: 'Tostón Serrano', description: '$ 7.500 - Pan crujiente con jamón serrano' },
            { id: 'SAL_2', title: 'Tostado JYQ', description: '$ 7.500 - Jamón y queso clásico' },
            { id: 'SAL_3', title: 'Tostado Crudo y Queso', description: '$ 9.000 - Jamón crudo y queso fundido' },
            { id: 'SAL_4', title: 'Tostado Árabe JYQ', description: '$ 5.000 - Pan árabe con jamón y queso' },
            { id: 'SAL_5', title: 'Tostado Árabe CrudYQues', description: '$ 6.000 - Jamón crudo y queso en pan árabe' },
            { id: 'SAL_6', title: 'Crudo y Campo en Árabe', description: '$ 8.500 - Jamón crudo y queso de campo en pan árabe' },
            { id: 'SAL_7', title: 'Cocido y Campo en Árabe', description: '$ 7.500 - Jamón cocido y queso de campo en pan árabe' }
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
            header: { type: "text", text: "Recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Salados", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaEscapeFlow]
)

const opnCafeteriaFlow = addKeyword(['CARTA_CAFETERIA']).addAnswer(
    '☕ Disfruta nuestras bebidas calientes y frías:',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'CAF_1', title: 'Café', description: '$ 2.500/$4.000 - Clásico o doble' },
            { id: 'CAF_2', title: 'Capuccino Italiano', description: '$ 5.000 - Café con leche y espuma' },
            { id: 'CAF_3', title: 'Submarino', description: '$ 6.000 - Leche caliente con chocolate' },
            { id: 'CAF_4', title: 'Té Matcha', description: '$ 5.500 - Té verde japonés' },
            { id: 'CAF_5', title: 'Moka', description: '$ 5.500 - Café con chocolate' },
            { id: 'CAF_6', title: 'Té', description: '$ 2.500 - Variedad de sabores' },
            { id: 'CAF_7', title: 'Frapuchino', description: '$ 5.000 - Café frío batido' },
            { id: 'CAF_8', title: 'Caramel', description: '$ 4.500 - Café con caramelo' },
            { id: 'CAF_9', title: 'Macchiato', description: '$ 6.000 - Espresso con leche' },
            { id: 'CAF_10', title: 'Café Tonic', description: '$ 6.000 - Café con tónica' }
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
            header: { type: "text", text: "Recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Cafetería", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaEscapeFlow]
)
const opnBebidasFlow = addKeyword(['CARTA_BEBIDAS']).addAnswer(
    '🥤 Refrescate con nuestras bebidas:',
    null,
    async (ctx, {provider}) => {
        const productsToRedeem = [
            { id: 'BEB_1', title: 'Exprimido Naranja', description: '$ 2.100/$2.900 - Vaso o grande' },
            { id: 'BEB_2', title: 'Limonada/Naranjeada', description: '$ 4.500 - 1 litro' },
            { id: 'BEB_3', title: 'Frutos Rojos', description: '$ 5.000 - 1 litro' },
            { id: 'BEB_4', title: 'Licuado', description: '$ 4.500 - Durazno, banana o frutilla' },
            { id: 'BEB_5', title: 'Coca Cola/Zero', description: '$ 2.500 - Lata 354cc' },
            { id: 'BEB_6', title: 'Sprite y Light', description: '$ 2.500 - Lata 354cc' },
            { id: 'BEB_7', title: 'Tónica', description: '$ 2.500 - Lata' },
            { id: 'BEB_8', title: 'Agua Bonaqua', description: '$ 2.500 - 500cc sin/con gas' },
            { id: 'BEB_9', title: 'Agua Saborizada', description: '$ 2.500 - 500cc, varios sabores' }
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
            header: { type: "text", text: "Recomendaciones" },
            body: { text: "-" },
            footer:{ text:"-" },
            action: { button: "Ver Bebidas", sections }
        };
        await provider.sendList(ctx.from, listMessage)
    },
    [rtaEscapeFlow]
)

/* Carta y recomendaciones */
const cartaYrecomendacionesFlow = addKeyword(['Carta y Recomen.', 'MENU_CARTA_RECOM'])
  .addAnswer(
    '¡Claro! Queremos mostrarte lo mejor de *AMORATTO*. Elegí una categoría para ver nuestras delicias:',
    null,
    async (ctx, { provider }) => {
      const categorias = [
        { id: 'CARTA_CAFETERIA', title: '☕Cafetería', description: 'Café, capuccino, té y acompañamientos' },
        { id: 'CARTA_DULCES', title: '🍫Dulces', description: 'Brownies, tortas, postres y golosinas' },
        { id: 'CARTA_PANADERIA', title: '🍞Panadería', description: 'Facturas, medialunas, panes artesanales' },
        { id: 'CARTA_BEBIDAS', title: '🥛Bebidas', description: 'Gaseosas, jugos, aguas y más' },
        { id: 'CARTA_HELADOS', title: '🍧Helados', description: 'Cremosos, frutales, en potes y más' },
      ];

      const sections = [{
        title: 'Categorías del Menú 🍽️',
        rows: categorias.map(cat => ({
          id: cat.id,
          title: cat.title,
          description: cat.description
        }))
      }];

      const listMessage = {
        header: { type: 'text', text: 'Carta y Recomendaciones' },
        body: { text: 'Seleccioná una categoría para conocer nuestras recomendaciones:' },
        footer: { text: 'AMORATTO - Sucursal Santa Fe' },
        action: {
          button: 'Ver Categorías',
          sections
        }
      };

      await provider.sendList(ctx.from, listMessage);
    },
    [
      opnDulcesFlow,
      opnPanaderiaFlow,
      opnHeladosFlow,
      opnSaladosFlow,
      opnCafeteriaFlow,
      opnBebidasFlow
    ]
  );

/* TRANSFERIR DINERO */
// Paso 1: iniciar el flujo con evento personalizado
const transferirDineroFlow = addKeyword(['Transferir Dinero', 'MENU_TRANSFERIR_DINERO'])
  .addAnswer('*¡Listo para transferir!* Por favor, indicá el número de cuenta de destino. Por ejemplo: 3424076088', {
    capture: true
  }, async (ctx, { state, gotoFlow }) => {
    await state.update({ cuentaDestino: ctx.body });
    return gotoFlow(pedirImporteFlow);
  });

const confirmarTransferencia2000Flow = addKeyword(['2000'])
  .addAnswer('Estás a punto de transferir $2.000...', null, async (ctx, { state, flowDynamic, gotoFlow }) => {
    const cuentaDestino = await state.get('cuentaDestino');
    let transferir = await ClienteController.confirmTransferencia(2000, cuentaDestino, ctx.from)
    if(transferir.error){
    await flowDynamic(`❌${transferir.error}`);
    }else{
        await flowDynamic(`¡Genial! Transferiste *$2.000* a la cuenta ${cuentaDestino}.`);
    }
    return gotoFlow(escapeActionFlow)
  });

const confirmarTransferencia4000Flow = addKeyword(['4000'])
  .addAnswer('Estás a punto de transferir $4.000...', null, async (ctx, { state, flowDynamic, gotoFlow }) => {
    const cuentaDestino = await state.get('cuentaDestino');
    let transferir = await ClienteController.confirmTransferencia(4000, cuentaDestino, ctx.from)
    if(transferir.error){
    await flowDynamic(`❌${transferir.error}`);
    }else{
        await flowDynamic(`¡Genial! Transferiste *$4.000* a la cuenta ${cuentaDestino}.`);
    }
    return gotoFlow(escapeActionFlow)
  });


const confirmarTransferencia10000Flow = addKeyword(['10000'])
  .addAnswer('Estás a punto de transferir $10.000...', null, async (ctx, { state, flowDynamic, gotoFlow }) => {
    const cuentaDestino = await state.get('cuentaDestino');
    let transferir = await ClienteController.confirmTransferencia(10000, cuentaDestino, ctx.from)
    if(transferir.error){
    await flowDynamic(`❌${transferir.error}`);
    }else{
        await flowDynamic(`¡Genial! Transferiste *$10.000* a la cuenta ${cuentaDestino}.`);
    }
    return gotoFlow(escapeActionFlow)
  });


const pedirImporteFlow = addKeyword(utils.setEvent('PEDIR_IMPORTE'))
  .addAnswer('Ahora seleccioná el monto que deseas transferir.', {
    capture: true,
    buttons: [
      { body: '2000' },
      { body: '4000' },
      { body: '10000' },
    ]
  }, null, [
    confirmarTransferencia10000Flow,
    confirmarTransferencia2000Flow,
    confirmarTransferencia4000Flow
  ]);

//Menu de opciones
/* const menuPpalFlow = addKeyword(['Menu principal', 'Si, soy cliente.']).addAnswer('Que queres hacer hoy?', {
    capture:true,
    buttons: [
        {body: 'Consultar Saldo'},
        {body: 'Canjear Producto'},
        {body: 'Carta y Recomen.'},
    ]
}, null, [dineroFlow, canjearFlow , cartaYrecomendacionesFlow, transferirDineroFlow])


 */
const menuPpalFlow = addKeyword(['Menu principal', 'Si, soy cliente.'])
  .addAnswer(
    '¿Qué te gustaría hacer hoy?', // Mensaje introductorio
    null, // No necesitamos botones aquí directamente
    async (ctx, { provider }) => {
      // Definimos las opciones de tu menú
      const menuOptions = [
        { id: 'MENU_CONSULTAR_SALDO', title: 'Consultar Saldo', description: 'Revisá el estado de tu cuenta.' },
        { id: 'MENU_CANJEAR_PRODUCTO', title: 'Canjear Producto', description: 'Descubrí nuestras ofertas.' },
        { id: 'MENU_CARTA_RECOM', title: 'Carta y Recomendaciones', description: 'Explorá nuestras sugerencias.' },
        { id: 'MENU_TRANSFERIR_DINERO', title: 'Transferir Dinero', description: 'Enviá dinero a otra cuenta.' }
      ];

      // Creamos la sección de la lista
      const sections = [{
        title: 'Selecciona una opción', // Título para la sección de la lista
        rows: menuOptions.map(option => ({
          id: option.id,           // ID único para identificar la opción seleccionada
          title: option.title,       // Texto principal de la opción
          description: option.description // Texto descriptivo de la opción (opcional, pero útil)
        }))
      }];

      // Preparamos el mensaje de lista
      const listMessage = {
        header: { type: "text", text: "Menú Principal" }, // Encabezado de la lista
        body: { text: "Elige la acción que deseas realizar:" }, // Cuerpo del mensaje
        footer: { text: "-" }, // Pie de página (opcional)
        action: {
          button: "Ver Opciones", // Texto del botón que abre la lista
          sections
        }
      };

      // Enviamos el mensaje de lista
      await provider.sendList(ctx.from, listMessage);
    },
    // Aquí es donde defines los flujos a los que se puede ir después de que el usuario seleccione una opción de la lista
    [dineroFlow, canjearFlow, cartaYrecomendacionesFlow, transferirDineroFlow]
  );


// REGISTRAR CLIENTES

const registerManualFlow = addKeyword(['No lo soy.']).addAnswer('¡Entendido! Estamos registrándote como cliente en nuestro sistema...', null,
    async (ctx, {flowDynamic}) => {
        let dinero = await ClienteController.getDinero(ctx.from)
        if(dinero.error){
            await flowDynamic(`❌Hubo un problema al registrarte. Por favor, intentá de nuevo más tarde.`)
        }else{
            if(dinero.nuevo){
                await flowDynamic(`¡Bienvenido/a! 🎉 Te acabamos de registrar como cliente en *AMORATTO*. ¡Como regalo de bienvenida, tenés *$ 2000*  para empezar a canjear!`)
            }else{
                await flowDynamic(`¡Ya estabas registrado/a! 😉 Tenés *$ ${dinero.dinero}* disponible.`)
            }
        }
    }
).addAction(async (ctx, { gotoFlow }) => {
    return gotoFlow(menuPpalFlow)
})





//Bienvenida

const welcomeFlow = addKeyword(['hi', 'hello', 'hola', 'Volver al inicio', 'buenas', 'buenos dias', 'Hola', 'Buenas']).addAnswer(`🙌 Hola! Bienvenido a *AMORATTO*`).addAnswer(
    'Para continuar, ¿ya sos cliente nuestro?',
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
.addAnswer('¿Hay algo más en lo que pueda ayudarte hoy?', {
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


const fallbackFlow = addKeyword([]).addAnswer('Disculpá, no logré entender tu mensaje. Por favor, intentá escribiendo *hola* para empezar de nuevo. ¡Gracias!')


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
       await connectMongo()
        const adapterFlow = createFlow([
        welcomeFlow, 
        dineroFlow, 
        cartaYrecomendacionesFlow, 
        canjearFlow, 
        transferirDineroFlow, 
        pedirImporteFlow,
        registerFlow, 
        fullSamplesFlow, 
        fallbackFlow
        ]);

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
    console.log('❌ERROR INTERNO CRITICO', error.message)
    process.exit(1)
}
}

main()