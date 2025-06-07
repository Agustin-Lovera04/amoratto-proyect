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
            return {error: 'Error interno - Contacte a un administrador.'}
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
      
    }






}