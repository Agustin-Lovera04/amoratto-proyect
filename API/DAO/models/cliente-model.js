import {model, Schema} from 'mongoose'


const clientesSchema = new Schema({
    numberID: {type: String, required: true, unique: true},
    dinero: {type: Number, default: 2000},
/*     canjes: {
        type: [
            {
                code: {type: String, required: true, unique:true},
                title: {type: String, required: true},
                valid: {type: Boolean, default: true},
                fecha: {type: Date, default: Date.now}
            }
        ]
    } */
    
})


export const clientesModel = new model('clientes', clientesSchema)