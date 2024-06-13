import express from 'express';
import { generateProduct } from '../utils/utils.js';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
const router = express.Router();

router.get('/', publicRouteAuth, async (req, res) => {
    try {
        let products = [];
        for(let i=0;i<100;i++){
            const product = generateProduct();
            products.push(product)
        }
        res.send({stats:"success", payload:products})
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Error al obtener los productos: ' + error.message });
    }
});

export default router;