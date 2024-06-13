import TicketsModel from "../models/ticket.schema.js";
import { logger } from "../../utils/logger.js";

class Tickets {
    post = async(ticket) => {
        try{
            const newTicket = new TicketsModel(ticket);
            const savedTicket = await newTicket.save();
            return savedTicket;
        } catch (error) {
            throw error;
        }
    }

    getOne = async(code) => {
        try {
            let ticket = await TicketsModel.find({code: code});
            let ticketData = JSON.stringify(ticket,null,"\t")
            if (!ticket) {
                return { success: false, message: 'No se encontró el carrito especificado.' };
            }
    
            return ticketData;
        } catch (error) {
            logger.error('Error al obtener los datos del carrito:', error.message);
            return { success: false, message: ' Error al obtener los datos del carrito.' };
        }
    }  
}


export default Tickets;