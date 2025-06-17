import mongoose from 'mongoose'

let isConnected = false

export const connectMongo = async () => {
  if (isConnected) {
    // Ya está conectado, reutilizar conexión
    return
  }

  try {
    await mongoose.connect(process.env.MONGO_DB_URI, {
      dbName: process.env.MONGO_DB_NAME,
    })
    isConnected = true
    console.log('MongoDB conectado ✅')
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message)
    throw error
  }
}

export const disconnectMongo = async () => {
  if (!isConnected) return

  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('MongoDB desconectado 👋')
  } catch (error) {
    console.error('Error desconectando MongoDB:', error.message)
  }
}
