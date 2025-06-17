import {model, Schema} from 'mongoose'


const clientesSchema = new Schema({
    numberID: {type: String, required: true, unique: true},
    dinero: {type: Number, default: 2000},
    
})


export const clientesModel = new model('clientes', clientesSchema)
