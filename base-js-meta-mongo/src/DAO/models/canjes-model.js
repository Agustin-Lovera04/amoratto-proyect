import {Schema, model} from 'mongoose'

const canjeSchema = new Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  valid: { type: Boolean, default: true },
  fecha: { type: Date, default: Date.now },
  cliente: { type: String }
})

export const canjesModel = new model('codesCanje', canjeSchema)
