import { canjesModel } from "../models/canjes-model.js";
import { clientesModel } from "../models/cliente-model.js"
import ShortUniqueId from 'short-unique-id';

const uid = new ShortUniqueId({ length: 6 });

export class ClienteManager{

    async createCliente(numberID){
        try {
            let createCliente = await clientesModel.create({numberID: numberID})
            if(!createCliente){
                return {error: 'Error al guardar cliente en DB'}
            }

            return {createCliente}
        } catch (error) {
            return {error: `Error al crear cliente en DB: ${error.message}`}
        }
    }
    async getCliente(numberID){
        try {
            let cliente = await clientesModel.findOne({numberID: numberID})
            if(!cliente){
                let cliente = await this.createCliente(numberID)
                cliente = cliente.createCliente
                return {cliente: cliente ,nuevo: true}
            }
            
            return {cliente: cliente}
        } catch (error) {
            console.log('entro a error', error)
         return {error: `Error Interno ${error.message}`}   
        }
    }

    async modDinero(numberID, coste, title){
        try {
            let cliente = await this.getCliente(numberID)
            if(!cliente.cliente){
                return {error: 'Error interno - Contacte a un administrador'}
            }
            let result = cliente.cliente.dinero - coste
            
            let codeCanje = uid.rnd(); 

            let mod = await clientesModel.updateOne(
                    { numberID: numberID },
                    {
                    $set: { dinero: result },
/*                     $push: { canjes: infoCanje } */
                    }
                    );
            if(!mod){
                return {error: 'Error interno - Contacte a un administrador'}
            }

            let saveInfoCanje = await canjesModel.create({code: codeCanje, title, cliente: numberID})
            if(!saveInfoCanje){
                return {error: 'Error interno - Contacte a un administrador'}
            }

            return {codeCanje}
        } catch (error) {
         return {error: `Error Interno ${error.message}`}           
        } 
    }
}