export default class ProductsRepository {
    constructor (dao){
        this.dao = dao;
    }

    updateStock = async (id, boughtQuantity) => {
        let result = await this.dao.put(id, boughtQuantity);
        return result;
    }

    getProductById = async (id) => {
        let result =await this.dao.getOne(id);
        return result;
    }

    createProduct = async (title, description, price, stock, category, owner) => {
        let result = await this.dao.post(title, description, price, stock, category, owner);
        return result;
    }

    deleteProduct = async (id) => {
        let result = await this.dao.delete(id);
        return result;
    }

    getProductByName = async (name) => {
        let result = await this.dao.getOneByName(name);
        return result;
    }
}