import { AdminManager as DAO } from "../DAO/manager/admin-manager.js";

class AdminService{
    constructor(DAO){
        this.dao = new DAO()
    }

    async validCode(code){
        return await this.dao.validCode(code)
    }

    async cargarDinero(numero, valor){
        return await this.dao.cargarDinero(numero, valor)
    }

    async getProducts(){
        return await this.dao.getProducts()
    }

    async getProductoById(id){
        return await this.dao.getProductoById(id)
    }

    async nuevoProducto(title, descripcion, dinero){
        return await this.dao.nuevoProducto(title,descripcion,dinero)
    }

    async desactivarProducto(id){
        return await this.dao.desactivarProducto(id)
    }

    async pagarDinero(numero, valor){
        return await this.dao.pagarDinero(numero,valor)
    }
} 


export const adminService = new AdminService(DAO)