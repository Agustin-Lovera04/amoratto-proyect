import { clienteService } from "../services/clientes-service.js";




export class ClienteController{
    static async getPuntos(numberID){
        let cliente = await clienteService.getCliente(numberID)
        if(!cliente.cliente || !cliente.cliente.puntos){
            return{ error: ' no se encontro informacion'}
        }
        if(cliente.cliente.error){
            return{ error: cliente.cliente.error}
        }

        if(cliente.nuevo){
            return {puntos: cliente.cliente.punto, nuevo: true}
        }
        return { puntos: cliente.cliente.puntos }
    
    } 


    static async processCanje(numberID, coste, title){
        let puntos = await this.getPuntos(numberID)
        if(!puntos){
            return{ error: 'Error interno - Contacte a un administrador.'}
        }

        if(puntos.puntos === undefined ||puntos.puntos < coste){
            return {error: 'No tienes suficientes puntos.'}
        }

        let modPuntos = await clienteService.modPuntos(numberID, coste,title)
        if(modPuntos.error){
            return {error: modPuntos.error}
        }

        return {code:modPuntos.codeCanje }
    }
}