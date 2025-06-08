import { Router } from "express";
import { auth } from "../../middleware/middleware.js";
import { AdminController } from "../../controller/admin-controller.js";

export const router = Router()

//SESIONES-----------------------------------
router.get('/', AdminController.renderLogin)


router.post('/', AdminController.login )

router.get('/logout', auth, AdminController.logout)

//------------------------------------------


router.get('/home', auth, (req, res) => {
    return res.render('home');
})


router.get('/api/amoratto/validarCodigo', auth, AdminController.renderValidCode)

router.post('/api/amoratto/validarCodigo', auth, AdminController.validCode)



router.get('/api/amoratto/cargarPuntos', auth, AdminController.renderCargarPuntos)

router.post('/api/amoratto/cargarPuntos', auth, AdminController.cargarPuntos)


router.get('/api/amoratto/cambiosProdCan', auth, AdminController.renderCambiosProdCan)

router.post('/api/amoratto/nuevoProducto', auth, AdminController.nuevoProducto)

router.post('/api/amoratto/desactivarProducto', auth, AdminController.desactivarProducto)



router.get('/api/amoratto/cambiosCarta', auth, (req,res)=> {
    return res.render('cambiosCarta')
})
