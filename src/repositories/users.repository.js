import UsersDTO from "../dao/DTOs/users.dto.js";
export default class UsersRepository {
    constructor (dao){
        this.dao = dao;
    }

    findUserByEmail = async (email) => {
        let result = await this.dao.getOne(email);
        return result;
    }

    createUser = async(user) => {
        let userToCreate = await this.dao.post(user);
        return userToCreate;  
    }

    createUserSession = async(user) => {
        let userSessionToCreate = new UsersDTO(user);
        return userSessionToCreate;
    }

    updateUserPassword = async(email, newPasswordHashed) => {
        let result = await this.dao.putPassword(email, newPasswordHashed);
        return result;  
    }

    updateUserRole = async(email, newRole) => {
        let result = await this.dao.putRole(email, newRole);
        return result;  
    }

    deleteUserByEmail = async(email) => {
        let result = await this.dao.delete(email);
        return result;
    }

    updateLastConnection = async(email) => {
        let result = await this.dao.dateupdate(email);
        return result;
    }

    updateUserDocuments = async(email, documentType) => {
        let result = await this.dao.putdocs(email, documentType);
        return result;
    }
}