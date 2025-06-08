import {Schema, model} from 'mongoose'

const productsSchema = new Schema({
    title: {type: String, required:true},
    puntos: {type: Number, required: true},
    description: {type: String, required: true},
    activo: {type: Boolean, default: true}
})

export const productsModel = new model('products', productsSchema)