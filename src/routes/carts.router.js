import express from 'express';
import nodemailer from 'nodemailer';
import { cartsService, productsService, ticketsService } from '../repositories/index.js';
import randomUniqueId from 'random-unique-id';
import { CustomError } from '../services/errors/errors.js';
import { logger } from '../utils/logger.js';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';

const router = express.Router();

var smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'matiasdelorenc@gmail.com',
        pass: 'cbar ughw lyxd ocgw'
    }
};
var transporter = nodemailer.createTransport(smtpConfig);

router.put('/addToCart', publicRouteAuth, async (req, res, next) => {
    try {
        const { productId } = req.query;
        const product = await productsService.getProductById(productId);
        logger.debug(`productId: ${productId}`);
        logger.debug(`product: ${product}`);
        logger.debug(`req.session.user.email: ${req.session.user.email}`);
        logger.debug(`product.owner: ${product.owner}`);
        logger.debug(`req.session.user.role: ${req.session.user.role}`);
        
        if (req.session.user.email === product.owner && req.session.user.role !== "admin") {
            return res.json({ message: "No puedes añadir tu propio producto al carrito" });
        }

        const cartId = req.session.user.cart;
        const result = await cartsService.addProductToCart(cartId, productId);
        
        if (result.success === false) throw new CustomError(`${result.message}`);
        
        res.json({ message: "Producto añadido al carrito con éxito" });
    } catch (error) {
        next(error);
    }
});


router.get('/', publicRouteAuth, async (req, res, next) => {
    try {
        const cartId = req.session.user.cart;
        const cartDataString = await cartsService.findCartByID(cartId);
        if (cartDataString.success === false) throw new CustomError(`${cartDataString.message}`);
        const cartDataArray = JSON.parse(cartDataString);
        const cartData = cartDataArray[0];
        const productsData = cartData.products;
        res.render('cart', { productsData });
    } catch (error) {
        next(error);
    }
});

router.post('/', publicRouteAuth, async (req, res, next) => {
    try {
        const { productId, quantityToAdd } = req.body;
        const cartId = req.session.user.cart;
        const result = await cartsService.increaseProductQuantity(cartId, productId, quantityToAdd);
        if (result.success === false) throw new CustomError(`${result.message}`);
        res.redirect("/api/cart");
    } catch (error) {
        next(error);
    }
});

router.delete("/clear", publicRouteAuth, async (req, res, next) => {
    try {
        const cartId = req.session.user.cart;
        const result = await cartsService.clearCart(cartId);
        if (result.success === false) throw new CustomError(`${result.message}`);
        res.redirect("/api/cart");
    } catch (error) {
        next(error);
    }
});

router.delete("/removeProduct/:productId", publicRouteAuth, async (req, res, next) => {
    try {
        const { productId } = req.params;
        const cartId = req.session.user.cart;
        const result = await cartsService.removeProductFromCart(cartId,productId);
        if (result.success === false) throw new CustomError(`${result.message}`);
        res.redirect("/api/cart");
    } catch (error) {
        next(error);
    }
});


router.post('/purchase', publicRouteAuth, async (req, res, next) => {
    try {
        const cartId = req.session.user.cart;
        const cartData = await cartsService.findCartByID(cartId);
        if (cartData.success === false) throw new CustomError(`${cartData.message}`);
        const cart = JSON.parse(cartData);
        const products = cart[0].products;

        const insufficientStockProducts = [];
        const validProducts = [];
        let totalPrice = 0;

        for (const productInCart of products) {
            const { product: productId, quantity } = productInCart;
            const product = await productsService.getProductById(productId);
            if (product.success === false) throw new CustomError(`${product.message}`);
            const productStock = product.stock;
            const updatedProduct = await productsService.updateStock(product.id, quantity);
            if (updatedProduct.success === false) throw new CustomError(`${updatedProduct.message}`);
            if (quantity > productStock) {
                insufficientStockProducts.push(product);
            } else {
                validProducts.push(product);
                const removedProduct = await cartsService.removeProductFromCart(cartId, product.id);
                if (removedProduct.success === false) throw new CustomError(`${removedProduct.message}`);
                totalPrice += product.price * quantity;
            }
        }

        if (insufficientStockProducts.length > 0) {
            logger.info('Los siguientes productos no tienen stock suficiente:', insufficientStockProducts);
        }

        if (validProducts.length > 0) {
            const uniqueId = randomUniqueId();
            const code = uniqueId.id;

            const newTicket = {
                code: code,
                amount: totalPrice,
                purchaser: JSON.stringify(req.session.user.email),
            };

            await ticketsService.createTicket(newTicket);

            const ticketData = await ticketsService.getTicketByCode(newTicket.code);
            const ticketArray = JSON.parse(ticketData);
            const ticket = ticketArray[0];

            let result = await transporter.sendMail({
                from: 'Coder Tests matiasdelorenc@gmail.com',
                to: ticket.purchaser,
                subject: `Ticket de Compra ${ticket.code}`,
                html: `
                <h1>Confirmación de tu compra</h1>
                <p>¡Hola, ${req.session.user.first_name} ${req.session.user.last_name}! Tu compra fue realizada con éxito 😁</p>
                <h2>Información:</h2>
                <ul>
                    <li>Código: ${ticket.code}</li>
                    <li>Importe: $-${ticket.amount}</li>
                    <li>Comprador: ${ticket.purchaser}</li>
                    <li>Fecha de compra: ${ticket.purchase_datetime}</li>
                </ul>
                `,
                attachments: []
            });

            res.redirect("/api/cart");
        } else {
            throw new CustomError('NO_VALID_PRODUCTS');
        }
    } catch (error) {
        logger.error('Error al realizar la compra:', error.message);
        next(error);
    }
});

export default router;