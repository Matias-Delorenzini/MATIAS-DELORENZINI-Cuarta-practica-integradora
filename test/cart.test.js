import supertest from "supertest";
import { expect } from 'chai';
import mongoose from "mongoose";

import config from '../src/config/config.js';

import { usersService } from '../src/repositories/index.js';
import { cartsService } from '../src/repositories/index.js';
import { productsService } from '../src/repositories/index.js';

const requester = supertest.agent(`http://localhost:${config.port}`);

describe('Testing con supertest del módulo de carts del ecommerce de Matias Delorenzini', function () {
    this.timeout(10000);

    const TestUser = {
        first_name: "TestUserName",
        last_name: "TestUserLastName",
        email: "testuser@gmail.com",
        age: 30,
        password: "passwordusertest"
    }

    const TestAdmin = {
        first_name: "TestAdminName",
        last_name: "TestAdminLastName",
        email: "testadmin@gmail.com",
        age: 30,
        password: "passwordadmintest",
        role: "admin"
    }

    const newProduct = {
        title: "TestProduct",
        description: "Producto de testeo",
        price: 29.99,
        stock: 10,
        category: "test"
    }

    const secondNewProduct = {
        title: "SecondTestProduct",
        description: "Segundo producto de testeo",
        price: 13.26,
        stock: 28,
        category: "test"
    }

    before(async function() {
        await mongoose.connect(config.mongoUrl);
    })

    after(async function() {
        await mongoose.disconnect();
    });


    describe('Test de carts', () => {
        describe('Test de PUT /api/cart/addToCart', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestAdmin);
                await requester.post('/api/sessions/login').send({
                    email: TestAdmin.email,
                    password: TestAdmin.password
                });
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, newProduct.owner);
            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.savedProduct._id);
                await usersService.deleteUserByEmail(TestAdmin.email);
                await cartsService.removeCart(`${TestAdmin.email}_cart`);
            });
            it('PUT /api/cart/addToCart debería añadir un producto al carrito', async () => {
                const response = await requester.put('/api/cart/addToCart').query({ productId: this.savedProduct._id.toString() });
                expect(response.statusCode).to.equal(200);
                expect(response.body).to.have.property('message', 'Producto añadido al carrito con éxito');

                const cartId = TestAdmin.email + "_cart"; 
                const cart = await cartsService.findCartByID(cartId);
                const cartData = JSON.parse(cart);
                
                const productExistsInCart = cartData[0].products.some(product => String(product.product._id) === String(this.savedProduct._id));
                expect(productExistsInCart).to.be.true;
            });
        })

        describe('Test de PUT /api/cart/addToCart añadiendo un producto propio', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestUser);
                await requester.post('/api/sessions/login').send({
                    email: TestUser.email,
                    password: TestUser.password
                });
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, TestUser.email);
            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.savedProduct._id);
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`);
            });
            it('PUT /api/cart/addToCart añadiendo un producto propio debería no permitirlo', async () => {
                const response = await requester.put('/api/cart/addToCart').query({ productId: this.savedProduct._id.toString() });
                expect(response.statusCode).to.equal(200);
                expect(response.body).to.have.property('message', 'No puedes añadir tu propio producto al carrito');

                const cartId = TestUser.email + "_cart"; 
                const cart = await cartsService.findCartByID(cartId);
                const cartData = JSON.parse(cart);
                
                const productExistsInCart = cartData[0].products.some(product => String(product.product._id) === String(this.savedProduct._id));
                expect(productExistsInCart).to.be.false;
            });
        })

        describe('Test de GET /api/cart/', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestAdmin);
                await requester.post('/api/sessions/login').send({
                    email: TestAdmin.email,
                    password: TestAdmin.password
                });
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, newProduct.owner);
                await requester.put('/api/cart/addToCart').query({ productId: this.savedProduct._id.toString() });
            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.savedProduct._id);
                await usersService.deleteUserByEmail(TestAdmin.email);
                await cartsService.removeCart(`${TestAdmin.email}_cart`);
            });
            it('GET /api/cart/ debería renderizar un carrito', async () => {
                const response = await requester.get('/api/cart/')
                expect(response.statusCode).to.equal(200);
                expect(response.ok).to.equal(true);
                expect(response.text).to.include(`<p style="display: none;">${this.savedProduct._id}</p>`);
            });
        })

        describe('Test de POST /api/cart/', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestAdmin);
                await requester.post('/api/sessions/login').send({
                    email: TestAdmin.email,
                    password: TestAdmin.password
                });
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, newProduct.owner);
                this.exampleQuantityToAdd = 5
                await requester.put('/api/cart/addToCart').query({ productId: this.savedProduct._id.toString() });
            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.savedProduct._id);
                await usersService.deleteUserByEmail(TestAdmin.email);
                await cartsService.removeCart(`${TestAdmin.email}_cart`);
            });
            it('POST /api/cart/ debería incrementar la cantidad del producto en el carrito', async () => {
                const response = await requester.post('/api/cart/').send({
                    productId: this.savedProduct._id,
                    quantityToAdd: this.exampleQuantityToAdd
                })
                expect(response.text).to.include('Found. Redirecting to /api/cart');
                const cartResponse = await requester.get('/api/cart/')
                const expectedQuantityString = `${this.savedProduct.title} Stock: ${this.savedProduct.stock} - Cantidad: ${1 + this.exampleQuantityToAdd}`;
                expect(cartResponse.text).to.include(expectedQuantityString);
            });
        })

        describe('Test de DELETE /api/cart/clear', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestAdmin);
                await requester.post('/api/sessions/login').send({
                    email: TestAdmin.email,
                    password: TestAdmin.password
                });
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, newProduct.owner);
                await requester.put('/api/cart/addToCart').query({ productId: this.savedProduct._id.toString() });
            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.savedProduct._id);
                await usersService.deleteUserByEmail(TestAdmin.email);
                await cartsService.removeCart(`${TestAdmin.email}_cart`);
            });
            it('DELETE /api/cart/clear debería vaciar el carrito', async () => {
                const response = await requester.delete('/api/cart/clear');
                expect(response.text).to.include('Found. Redirecting to /api/cart');
                const cartResponse = await requester.get('/api/cart/')
                expect(cartResponse.text).to.include('<p>El carrito está vacío.</p>');
            });
        })

        describe('Test de DELETE /api/cart/removeProduct/:productId', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestAdmin);
                await requester.post('/api/sessions/login').send({
                    email: TestAdmin.email,
                    password: TestAdmin.password
                });
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, newProduct.owner);
                this.secondSavedProduct = await productsService.createProduct(secondNewProduct.title, secondNewProduct.description, secondNewProduct.price, secondNewProduct.stock, secondNewProduct.category, secondNewProduct.owner);
                await requester.put('/api/cart/addToCart').query({ productId: this.savedProduct._id.toString() });
                await requester.put('/api/cart/addToCart').query({ productId: this.secondSavedProduct._id.toString() });

            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.savedProduct._id);
                await productsService.deleteProduct(this.secondSavedProduct._id);
                await usersService.deleteUserByEmail(TestAdmin.email);
                await cartsService.removeCart(`${TestAdmin.email}_cart`);
            });
            it('DELETE /api/cart/removeProduct/:productId debería eliminar un producto del carrito', async () => {
                let cartResponse = await requester.get('/api/cart/');
                expect(cartResponse.text).to.include(`<p style="display: none;">${this.savedProduct._id}</p>`);
                expect(cartResponse.text).to.include(`<p style="display: none;">${this.secondSavedProduct._id}</p>`);

                await requester.delete(`/api/cart/removeProduct/${this.savedProduct._id}`);
                
                cartResponse = await requester.get('/api/cart/');
                expect(cartResponse.text).to.not.include(`<p style="display: none;">${this.savedProduct._id}</p>`);
                expect(cartResponse.text).to.include(`<p style="display: none;">${this.secondSavedProduct._id}</p>`);

                await requester.delete(`/api/cart/removeProduct/${this.secondSavedProduct._id}`);
        
                cartResponse = await requester.get('/api/cart/');
                expect(cartResponse.text).to.not.include(`<p style="display: none;">${this.savedProduct._id}</p>`);
                expect(cartResponse.text).to.not.include(`<p style="display: none;">${this.secondSavedProduct._id}</p>`);
                expect(cartResponse.text).to.include('<p>El carrito está vacío.</p>');
            });
        })

        describe('Test de POST /purchase', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestUser);
                await requester.post('/api/sessions/login').send({
                    email: TestUser.email,
                    password: TestUser.password
                });
                this.savedProduct = await productsService.createProduct(
                    newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, newProduct.owner
                );
                await requester.put('/api/cart/addToCart').query({ productId: this.savedProduct._id.toString() });
            });
            
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.savedProduct._id);
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`);
            });
            
            it('POST /purchase debería hacer la compra', async function () {
                const response = await requester.post('/api/cart/purchase');
                expect(response.status).to.equal(302);
                expect(response.headers.location).to.equal('/api/cart');
            });
        })
    });    
})