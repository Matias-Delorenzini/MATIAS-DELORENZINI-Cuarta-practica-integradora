import ProductsModel from "../models/products.schema.js";
import { logger } from "../../utils/logger.js";

class Products {
    async getOne(id) {
        if (!id) return {success: false, message: 'PRODUCT_SEARCH_MISSING_ARGUMENTS'};
        try {
            const product = await ProductsModel.findById(id);
            if (!product) return {success: false, message: 'PRODUCT_NOT_FOUND'};
            return product;
        } catch (error) {
            logger.error('Error al obtener el producto por ID:', error.message);
            return {success: false, message: 'PRODUCT_SEARCH_ERROR'};
        }
    }

    async getOneByName(name) {
        if (!name) return {success: false, message: 'PRODUCT_SEARCH_MISSING_ARGUMENTS'};
        try {
            const product = await ProductsModel.findOne({title: name});
            if (!product) return {success: false, message: 'PRODUCT_NOT_FOUND'};
            return product;
        } catch (error) {
            logger.error('Error al obtener el producto por ID:', error.message);
            return {success: false, message: 'PRODUCT_SEARCH_ERROR'};
        }
    }

    async post( title, description, price, stock, category, owner ) {
        if (!title || !description || !price || !stock || !category) return {success: false, message: 'PRODUCT_CREATE_MISSING_ARGUMENTS'};
        if (isNaN(stock) || isNaN(price)) return {success: false, message: 'PRODUCT_CREATE_INVALID_QUANTITY'}
        try {
            const newProduct = new ProductsModel({ title, description, price, stock, category, owner });
            const savedProduct = await newProduct.save();
            logger.debug(`NUEVO PRODUCTO: ${savedProduct}`)
            return savedProduct;
        } catch (error) {
            logger.error('Error al crear el producto:', error.message);
            return { success: false, message: 'PRODUCT_CREATE_ERROR' };;
        }
    }

    async put(id, boughtQuantity) {
        if (!id || !boughtQuantity) return {success: false, message: 'PRODUCT_UPDATE_MISSING_ARGUMENTS'};
        if (isNaN(boughtQuantity)) return { success: false, message: 'PRODUCT_UPDATE_INVALID_QUANTITY' };

        try {
            const updatedProduct = await ProductsModel.findOneAndUpdate(
                { _id: id },
                { $inc: { stock: -boughtQuantity } },
                { new: true }
            );

            if (!updatedProduct) {
                return { success: false, message: 'PRODUCT_NOT_FOUND' };
            }

            return { success: true, product: updatedProduct };
        } catch (error) {
            logger.error('Error al actualizar el stock del producto:', error.message);
            return { success: false, message: 'PRODUCT_UPDATE_ERROR' };
        }
    }

    async delete(id) {
        if (!id) return { success: false, message: 'PRODUCT_DELETE_MISSING_ARGUMENTS' };
    
        try {
            const deletedProduct = await ProductsModel.findOneAndDelete({ _id: id });
    
            if (!deletedProduct) {
                return { success: false, message: 'PRODUCT_DELETE_NOT_FOUND' };
            }
    
            return { success: true, product: deletedProduct };
        } catch (error) {
            logger.error('Error al eliminar el producto:', error.message);
            return { success: false, message: 'PRODUCT_DELETE_ERROR' };
        }
    }    
}

export default Products;