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
    async getCliente(numberID) {
        try {
            let cliente = await clientesModel.findOne({ numberID })

            if (!cliente) {
                const nuevoCliente = await this.createCliente(numberID)

                if (nuevoCliente.error) return nuevoCliente

                return { cliente: nuevoCliente.createCliente, nuevo: true }
            }

            return { cliente }
        } catch (error) {
            return { error: `Error Interno ${error.message}` }
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
         return {error: `Error Interno - Contacte a un administrador`}           
        } 
    }



  async confirmTransferencia(importe, cuentaDestino, numberID) {
    try {

        const clienteRemitenteRes = await this.getCliente(numberID);
        if (clienteRemitenteRes.error) {
            return { error: 'Error interno - Contacte a un administrador (remitente)' };
        }
        const clienteRemitente = clienteRemitenteRes.cliente;

        if (clienteRemitente.dinero < importe) {
            return { error: 'El importe que deseas transferir es mayor al saldo en tu cuenta.' };
        }

        const cuentaDestinoFull = cuentaDestino.startsWith('549') ? cuentaDestino : `549${cuentaDestino}`;
        const clienteDestinoRes = await clientesModel.findOne({ numberID: cuentaDestinoFull });
        if (!clienteDestinoRes) {
            return { error: 'La cuenta destino no existe.' };
        }

        // 4. Calcular nuevos saldos
        const saldoFinalDestino = clienteDestinoRes.dinero + importe;
        const saldoFinalRemitente = clienteRemitente.dinero - importe;

        // 5. Actualizar saldo del destino
        const updateDestino = await clientesModel.updateOne(
            { numberID: clienteDestinoRes.numberID },
            { dinero: saldoFinalDestino }
        );

        // 6. Actualizar saldo del remitente
        const updateRemitente = await clientesModel.updateOne(
            { numberID: clienteRemitente.numberID },
            { dinero: saldoFinalRemitente }
        );

        // 7. Verificar éxito de ambos updates
        if (!updateDestino.modifiedCount || !updateRemitente.modifiedCount) {
            return { error: 'Error al procesar la transferencia. Intente nuevamente.' };
        }

        return {
            success: true,
        };
    } catch (error) {
        return { error: 'Error interno - Contacte a un administrador' };
    }
}

}