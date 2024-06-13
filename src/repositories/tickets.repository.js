export default class TicketsRepository {
    constructor (dao){
        this.dao = dao;
    }

    createTicket = async (ticket) => {
        let result = await this.dao.post(ticket);
        return result;
    }    

    getTicketByCode = async (code) => {
        let result = await this.dao.getOne(code);
        return result;
    }
}