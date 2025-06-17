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

    static async renderCargarDinero(req,res){
      return res.render('cargarDinero')
    }

    static async cargarDinero(req,res){
      let { numero, valor } = req.body
      if(!numero || numero.length === 0 || !valor || valor.length === 0 ){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Error interno - Alerte error'});
      }
      
      valor = parseInt(valor);


      let cargarDinero = await adminService.cargarDinero(numero, valor)
      if(cargarDinero.error){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: cargarDinero.error});
      }



      res.setHeader('Content-Type','application/json');
      return res.status(200).json({dinero: cargarDinero.dinero});
    }

/* ---------------------------------------------------------------------------------------------------------------------------- */

static async renderRecomDinero(req,res){
      return res.render('recomDinero')
  }



  static async recomDinero(req,res){
  let {numero, valor} = req.body
    if(!numero || numero.length === 0 || !valor || valor.length === 0 ){
      res.setHeader('Content-Type','application/json');
      return res.status(404).json({error: 'Error interno - Alerte error'});
    }
    
    valor = parseInt(valor);
    let result;
    if (valor < 6000) {
      result = 0;
    } else if (valor <= 10000) {
      result = 1500;
    } else if (valor <= 15000) {
      result = 2500;
    } else {
      result = 3500;
}

    if(result === 0){
     res.setHeader('Content-Type','application/json');
     return res.status(404).json({error: 'Solo tienen recompensa las compras con un valor mayor a $6.000'}); 
    }

    let cargarDinero = await adminService.cargarDinero(numero, result)
    if(cargarDinero.error){
      res.setHeader('Content-Type','application/json');
      return res.status(404).json({error: cargarDinero.error});
    }
    res.setHeader('Content-Type','application/json');
    return res.status(200).json({dinero: cargarDinero.dinero});
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
      let { title, descripcion, dinero } = req.body

      if(!title || !descripcion || !dinero){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Error interno - Alerte error'});
      }

      let nuevoProducto = await adminService.nuevoProducto(title, descripcion,dinero)
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


//PAGAR CON PUNTOS--------------------------------------------------------------------------------------------------
    static async renderPagarDinero(req,res){
      return res.render('pagarDinero')
    }

    static async pagarDinero(req,res){
      let {numero, valor} = req.body
      if(!numero || numero.length === 0 || !valor || valor.length === 0 ){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: 'Error interno - Alerte error'});
      }
      
      valor = parseInt(valor)
      let pagarDinero = await adminService.pagarDinero(numero, valor)
      if(pagarDinero.error){
        res.setHeader('Content-Type','application/json');
        return res.status(404).json({error: pagarDinero.error});
      }
      res.setHeader('Content-Type','application/json');
      return res.status(200).json({dinero: pagarDinero.result});
      }

}