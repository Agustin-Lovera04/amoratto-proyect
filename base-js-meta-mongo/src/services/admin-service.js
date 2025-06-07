import { AdminManager as DAO } from "../DAO/manager/admin-manager.js";

class AdminService{
    constructor(DAO){
        this.dao = new DAO()
    }

    async validCode(code){
        return await this.dao.validCode(code)
    }
} 


export const adminService = new AdminService(DAO)