import { canjesModel } from "../models/canjes-model.js"
import { clientesModel } from "../models/cliente-model.js"
import { productsModel } from "../models/products-model.js"

export class AdminManager {
    async validCode(code){
        try {
            let validCode = await canjesModel.findOne({code: code})
            if(!validCode){
                return {error: 'Codigo no existente'}
            }
            if(validCode.valid === false){
                return {error: 'Codigo invalido - Ya fue usado'}
            }

            let mod = await canjesModel.updateOne({code: code}, {valid: false})
            if(!mod){
                return {error: 'Error interno -  Alerte error'}
            }
            return (validCode)
        } catch (error) {
            return {error: 'Error interno - Alerte error'}
        }
    }


    async cargarDinero(numero, dinero){
        try {
            let cliente = await clientesModel.findOne({numberID: numero})
            if(!cliente){
                return {error: 'No se encontro cliente con el numero de telefono ingresado'}
            }

            let result = (cliente.dinero + dinero) 

            const cargar = await clientesModel.updateOne({numberID: numero}, {dinero: result})
            if(!cargar){
                return {error: 'Error interno - Alerte error'}
            }
            

            return {dinero: result}
        } catch (error) {
            return {error: 'Error interno - Alerte error'}
        }
    }


    async getProducts(){
        try {
            let products = await productsModel.find({activo: true})
            if(!products){
                return {error: 'Error interno - Alerte error'}
            }

            return products
        } catch (error) {
            return {error: 'Error interno - Alerte error'}
        }
    }


    async getProductoById(id){
        try {
            let product = await productsModel.findOne({_id: id})
            if(!product){
                return { error: 'Error interno - Alerte error'}
            }
            return product
        } catch (error) {
            return {error: 'Error interno - Alerte error'}
        }
    }

    async nuevoProducto(title,descripcion,dinero){
        try {
            let getProducts = await this.getProducts()
            if(!getProducts){
                return {error: 'Error interno - Alerte error'}
            }
            console.log(getProducts.length)
            if(getProducts.length >= 10){
                return {error: 'Hay mas de 10 productos activos actualmente, desactiva uno para poder crear un producto nuevo.'}
            }

            let nuevoProducto = await productsModel.create({title: title, description: descripcion, dinero: dinero})
            if(!nuevoProducto){
                return {error: 'Error interno - Alerte error'}
            }

            return {success: true}
        } catch (error) {
            return {error: 'Error interno - Alerte error'}
        }
    }

    async desactivarProducto(id){
        try {
            let desactivar = await productsModel.updateOne({_id: id}, {activo: false})
            if(!desactivar){
                return {error: 'Error interno - Alerte error'}
            }
            return {success: true}
        } catch (error) {
            return {error: 'Error interno - Alerte error'}
        }
    }

    async pagarDinero(numero, valor){
        try {
            let cliente = await clientesModel.findOne({numberID: numero})
            if(!cliente){
                return {error: 'No hay clientes registrados con el numero ingresado.'}
            }
            valor = valor - (valor * 0.05);

            if(cliente.dinero < valor){
                return {error: `Dinero en cuenta insuficiente. Tiene: $${cliente.dinero}`}
            }

            let result = cliente.dinero - valor

            let pagarDinero = await clientesModel.updateOne({numberID: numero}, {dinero: result})
            if(!pagarDinero){
                return { error: 'Error interno - Alerte error'}
            }

            return {result}
        } catch (error) {
            return {error: 'Error interno - Alerte error'}
        }
    }
}