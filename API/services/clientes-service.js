import { ClienteManager as DAO} from "../DAO/manager/clientes-manager.js"

class ClienteService{
  constructor(DAO){
    this.dao = new DAO()
  }


  async getCliente(numberID){
    return await this.dao.getCliente(numberID)
  }

  async modDinero(numberID, coste,title){
    return await this.dao.modDinero(numberID, coste,title)
  }
  
}


export const clienteService = new ClienteService(DAO)