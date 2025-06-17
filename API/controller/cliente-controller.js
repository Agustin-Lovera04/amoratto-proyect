import { adminService } from "../services/admin-service.js";
import { clienteService } from "../services/clientes-service.js";




export class ClienteController{
    static async getDinero(numberID){
        let cliente = await clienteService.getCliente(numberID)
        if(!cliente.cliente || !cliente.cliente.dinero){
            return{ error: ' no se encontro informacion'}
        }
        if(cliente.cliente.error){
            return{ error: cliente.cliente.error}
        }

        if(cliente.nuevo){
            return {dinero: cliente.cliente.dinero, nuevo: true}
        }
        return { dinero: cliente.cliente.dinero }
    
    } 


    static async processCanje(numberID, coste, title){
        let dinero = await this.getDinero(numberID)
        if(!dinero){
            return{ error: 'Error interno - Contacte a un administrador.'}
        }

        if(dinero.dinero === undefined ||dinero.dinero < coste){
            return {error: 'No tienes suficiente saldo.'}
        }

        let modDinero = await clienteService.modDinero(numberID, coste,title)
        if(modDinero.error){
            return {error: modDinero.error}
        }

        return {code:modDinero.codeCanje }
    }


    static async getProducts(){
        let products = await adminService.getProducts()
        if(products.error){
            return {error: products.error}            
        }
        return products
    }

    static async getProductoById(id){
        let product = await adminService.getProductoById(id)
        if(product.error){
            return {error: product.error}
        }

        return product
    }
}