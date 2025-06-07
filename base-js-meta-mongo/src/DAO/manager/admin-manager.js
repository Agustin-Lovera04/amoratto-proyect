import { canjesModel } from "../models/canjes-model.js"

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
                return {error: 'Error interno - Contacte a un Administrador'}
            }
            return (validCode)
        } catch (error) {
            return {error: 'Error interno - Contacte a un Administrador'}
        }
    }

}