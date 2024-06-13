import express from 'express';
const router = express.Router();
import ProductsModel from '../dao/models/products.schema.js';
import { productsService } from '../repositories/index.js';
import { CustomError } from '../services/errors/errors.js';
import { authorize } from './middlewares/authorize.middleware.js';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
import { logger } from '../utils/logger.js';

router.post('/', publicRouteAuth, authorize(["premium","admin"]), async (req, res, next) => {
    try {
        console.log('User in session:', req.session.user);
        const user = req.session.user
        logger.debug(`User: ${user}`)

        const { title, description, price, stock, category } = req.body;
        logger.debug(`Title: ${title}`)
        logger.debug(`Description: ${description}`)
        logger.debug(`Price: ${price}`)
        logger.debug(`Stock: ${stock}`)
        logger.debug(`Category: ${category}`)

        const owner = user.email
        logger.debug(`Owner: ${owner}`)

        const result = await productsService.createProduct(title, description, price, stock, category, owner);
        logger.debug(result)

        if (result.success === false) throw new CustomError(`${result.message}`);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/create-product', publicRouteAuth, authorize(["premium","admin"]), async (req, res, next) => {
    logger.debug(req.session.user.role)
    try{
        res.render("create-product")
    } catch (error) {
        next(error);
    }
})

router.get('/delete-product/:id', publicRouteAuth, authorize(["premium", "admin"]), async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = req.session.user;
        const productToDelete = await productsService.getProductById(id);

        if (productToDelete.success === false) throw new CustomError(`${productToDelete.message}`);
        
        logger.debug(`ID: ${id}`);
        logger.debug(`productToDelete: ${productToDelete}`);
        logger.debug(`productToDelete.owner: ${productToDelete.owner}`);
        logger.debug(`user.email: ${user.email}`);
        logger.debug(`user.role: ${user.role}`);
        
        if (productToDelete.owner !== user.email && user.role !== "admin") {
            return res.status(403).send('No tienes permisos para borrar este producto');
        }
        
        const result = await productsService.deleteProduct(id);
        logger.debug(result);

        if (result.success === false) throw new CustomError(`${result.message}`);

        res.send(`
            <html>
                <body>
                    <center><h3>Se ha eliminado el producto</h3></center>
                </body>
            </html>
        `);
    } catch (error) {
        next(error);
    }
});


router.get('/', publicRouteAuth, async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 5;
        let page = req.query.page || 1;
        let sort = req.query.sort;
        let query = req.query.query;

        let filters = {};
        let sortOptions = {};

        if (sort === 'asc' || sort === 'desc') {
            sortOptions = { price: sort };
        }

        if (query) {
            filters = { ...filters, category: query };
        }
        if (req.query.stock !== null && req.query.stock !== undefined) {
            filters = { ...filters, stock: { $gt: 0 } };
        }

        const result = await ProductsModel.paginate(filters, { page, limit, lean: true, sort: sortOptions });

        result.prevLink = result.hasPrevPage ? `/api/products?page=${result.prevPage}` : '';
        result.nextLink = result.hasNextPage ? `/api/products?page=${result.nextPage}` : '';
        result.isValid = !(isNaN(page) || page <= 0 || page > result.totalPages);

        const userData = req.session.user;
        
        res.render('products', { result, userData });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Error al obtener los productos: ' + error.message });
    }
});

export default router;