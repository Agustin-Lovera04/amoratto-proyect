import { adminService } from "../services/admin-service.js";

export class AdminController {



//SESIONES--------------------------------------------------------------------------------------------------------------

    static async renderLogin(req,res){
      let {msg} = req.query
      if(!msg){
        msg = null
      }
      res.render('login', {msg})
    }
    
    
    static async login(req,res){
        let {user, password} = req.body
        
      if(!user || !password){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Error interno - Alertar error'});
    }
    
      if(user === process.env.USER_KEY && password === process.env.PASSWORD_KEY){
    
        res.cookie("cookieAmoratto", 'true', {
          maxAge: 1000 * 60 * 60,
          httpOnly: true,
          signed: true,
        });
        res.setHeader('Content-Type','application/json');
        return res.status(200).json({ok: 'ok'});
    }else{
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Datos incorrectos'});
    }
    
}


    static async logout(req,res){
      let cookie = req.signedCookies.cookieAmoratto
        if (!cookie) {
          return res.redirect(`/?msg=Error interno - Alertar Error` )
        }
    
        await res.clearCookie('cookieAmoratto', {signed: true})
        return res.redirect('/')
    }



//VALIDAR CODIGOS--------------------------------------------------------------------------------------------------------------------
    static async renderValidCode(req,res){
      return res.render('validarCodigo')
    }

    static async validCode(req,res){
        let {code} = req.body

        if(!code){
            res.setHeader('Content-Type','application/json');
            return res.status(404).json({error: 'Error interno - Alerte error'});
        }

        let valid = await adminService.validCode(code)
        if(valid.error){
            res.setHeader('Content-Type','application/json');
            return res.status(404).json({error: valid.error});
        }

        res.setHeader('Content-Type','application/json');
        return res.status(200).json({title: valid.title});
    }
    
//------------------------------------------------------------------------------------------------------------------------------
    
//CARGAR PUNTOS--------------------------------------------------------------------------------------------------

    static async renderCargarPuntos(req,res){
      return res.render('cargarPuntos')
    }

    static async cargarPuntos(req,res){
      let { numero, valor } = req.body
      if(!numero || numero.length === 0 || !valor || valor.length === 0 ){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Error interno - Alerte error'});
      }
      
      let puntos;
      valor = parseInt(valor);

      if (valor <= 3500) {
        puntos = 5;
      } else if (valor <= 7500) {
        puntos = 10;
      } else {
        puntos = 15;
      }

      let cargarPuntos = await adminService.cargarPuntos(numero, puntos)
      if(cargarPuntos.error){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: cargarPuntos.error});
      }



      res.setHeader('Content-Type','application/json');
      return res.status(200).json({puntos: cargarPuntos.puntos});
    }



//CAMBIOS PRODUCTOS CANJEABLES--------------------------------------------------------------------------------------------------

    static async renderCambiosProdCan(req,res){
      let {msg} = req.query
      if(!msg){
        msg = null
      }

      let products = await adminService.getProducts()
      if(products.error){
        msg = products.error
        products = null
      }
      return res.render('cambiosProdCan', {msg, products})
    }

    static async nuevoProducto(req,res){
      let { title, descripcion, puntos } = req.body

      if(!title || !descripcion || !puntos){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Error interno - Alerte error'});
      }

      let nuevoProducto = await adminService.nuevoProducto(title, descripcion,puntos)
      if(nuevoProducto.error){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: nuevoProducto.error});
      }

      res.setHeader('Content-Type','application/json');
      return res.status(200).json({ok: nuevoProducto});
    }

//--------------------------------------------------------------------------------------------------


//DESACTIVCAR PRODUCTOS CANJEABLES--------------------------------------------------------------------------------------------------
    static async desactivarProducto(req,res){
      let {id} = req.body
      if(!id){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Error interno - Alerte error'});
      }

      let desactivarProducto = await adminService.desactivarProducto(id)
      if(desactivarProducto.error){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: desactivarProducto.error});
      }

      res.setHeader('Content-Type','application/json');
      return res.status(200).json({ok: 'ok'});
    }


}