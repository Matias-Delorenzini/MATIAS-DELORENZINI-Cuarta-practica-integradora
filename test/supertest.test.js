import supertest from "supertest";
import { expect } from 'chai';
import mongoose from "mongoose";

import config from '../src/config/config.js';

import { usersService } from '../src/repositories/index.js';
import { cartsService } from '../src/repositories/index.js';
import { productsService } from '../src/repositories/index.js';

const requester = supertest.agent(`http://localhost:${config.port}`);

describe('Testing con supertest del ecommerce de Matias Delorenzini', function () {
    this.timeout(10000);

    const TestUser = {
        first_name: "TestUserName",
        last_name: "TestUserLastName",
        email: "testuser@gmail.com",
        age: 30,
        password: "passwordusertest"
    }

    const TestPremium = {
        first_name: "TestPremiumName",
        last_name: "TestPremiumLastName",
        email: "testpremium@gmail.com",
        age: 30,
        password: "passwordpremiumtest",
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

    describe('Test de sessions', () => {

        describe('Test de GET /current', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestUser);
                await requester.post('/api/sessions/login').send({
                    email: TestUser.email,
                    password: TestUser.password
                });
            });
            it('GET /current debería devolver el usuario actual si está autenticado', async () => {
                const response = await requester.get('/api/sessions/current');
                expect(response.statusCode).to.equal(200);
                expect(response.body).to.have.property('user');
            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`);
            });
        });

        describe('Test de POST /register', () => {
            it('POST /register debería registrar un nuevo usuario', async () => {
                const response = await requester.post('/api/sessions/register').send(TestUser);
                expect(response.statusCode).to.equal(302);
            });
            afterEach(async () => {
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`);
            });
        });

        describe('Test de GET /failregister', () => {
            it('GET /failregister debería redirigir a "/register"', async () => {
                const response = await requester.get('/api/sessions/failregister');
                const { statusCode, text } = response;
                expect(statusCode).to.equal(302);
                expect(text).to.equal('Found. Redirecting to /register');
            });
        });

        describe('Test de POST /login', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestUser);
            });
            it('POST /login debería iniciar sesión con credenciales válidas', async () => {
                const credentials = {
                    email: TestUser.email,
                    password: TestUser.password
                };
                const response = await requester.post('/api/sessions/login').send(credentials);
                const { statusCode } = response;
                expect(statusCode).to.equal(302);
            });
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`);
            });
        });

        describe('Test de GET /faillogin', () => {
            it('GET /faillogin debería redirigir a "/login"', async () => {
                const response = await requester.get('/api/sessions/faillogin');
                const { statusCode, text } = response;
                expect(statusCode).to.equal(302);
                expect(text).to.equal('Found. Redirecting to /login');
            });
        });

        describe('Test de POST /logout', () => {
            beforeEach(async () => {
                await requester.post('/api/sessions/register').send(TestUser);
                await requester.post('/api/sessions/login').send({
                    email: TestUser.email,
                    password: TestUser.password
                });
            });
            it('POST /logout debería cerrar la sesión del usuario', async () => {
                const response = await requester.post('/api/sessions/logout');
                const { statusCode } = response;
                expect(statusCode).to.equal(302);
            })
            afterEach(async () => {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`);
            });
        });
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

    describe('Test de products', () => {

        describe('Test de POST /api/products/', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestPremium);
                await requester.post('/api/sessions/login').send({
                    email: TestPremium.email,
                    password: TestPremium.password
                });
                this.user = await usersService.findUserByEmail(TestPremium.email)
                await requester.get(`/api/users/premium/${TestPremium.email}`);
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.product._id);
                await usersService.deleteUserByEmail(TestPremium.email);
                await cartsService.removeCart(`${TestPremium.email}_cart`)
            });
            it('POST /api/products/ debería crear el producto', async function () {
                const response = await requester.post('/api/products').send({
                    title: newProduct.title,
                    description: newProduct.description,
                    price: newProduct.price,
                    stock: newProduct.stock,
                    category: newProduct.category
                });
                this.product = await productsService.getProductByName(newProduct.title)
                expect(response.text).to.equal(`{"title":"${newProduct.title}","description":"${newProduct.description}","price":${newProduct.price},"stock":${newProduct.stock},"category":"${newProduct.category}","owner":"${TestPremium.email}","_id":"${this.product._id}","__v":0}`);
            });
        });
        
        describe('Test de POST /api/products/ con usuario no premium', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestUser);
                await requester.post('/api/sessions/login').send({
                    email: TestUser.email,
                    password: TestUser.password
                });
                this.user = await usersService.findUserByEmail(TestUser.email)
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await productsService.deleteProduct(this.product._id);
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`)
            });
            it('POST /api/products/ debería con usuario no premium NO debería crear el producto', async function () {
                const response = await requester.post('/api/products').send({
                    title: newProduct.title,
                    description: newProduct.description,
                    price: newProduct.price,
                    stock: newProduct.stock,
                    category: newProduct.category
                });
                this.product = await productsService.getProductByName(newProduct.title)
                expect(response.statusCode).to.equal(403);
                expect(`${response.error}`).to.equal('Error: cannot POST /api/products (403)');
                expect(response.text).to.not.equal(`{"title":"${newProduct.title}","description":"${newProduct.description}","price":${newProduct.price},"stock":${newProduct.stock},"category":"${newProduct.category}","owner":"${TestUser.email}","_id":"${this.product._id}","__v":0}`);
            });
        })

        describe('Test de GET /api/products/create-product', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestPremium);
                await requester.post('/api/sessions/login').send({
                    email: TestPremium.email,
                    password: TestPremium.password
                });
                this.user = await usersService.findUserByEmail(TestPremium.email)
                await requester.get(`/api/users/premium/${TestPremium.email}`);
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestPremium.email);
                await cartsService.removeCart(`${TestPremium.email}_cart`)
            });
            it('GET /api/products/create-product debería renderizar la vista create-product', async function () {
                const response = await requester.get('/api/products/create-product')
                expect(response.text).to.include('        <h1>Create a New Product</h1>\r\n' +
                    '<form action="/api/products" method="post">\r\n' +
                    '    <label for="title">Title:</label>\r\n' +
                    '    <input type="text" id="title" name="title" required>\r\n');
                expect(response.request.url).to.equal(`http://localhost:${config.port}/api/products/create-product`)
            });
        })

        describe('Test de GET /api/products/create-product con usuario no premium', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestUser);
                await requester.post('/api/sessions/login').send({
                    email: TestUser.email,
                    password: TestUser.password
                });
                this.user = await usersService.findUserByEmail(TestUser.email)
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`)
            });
            it('GET /api/products/create-product con usuario no premium NO debería renderizar la vista create-product', async function () {
                const response = await requester.get('/api/products/create-product')
                expect(response.statusCode).to.equal(403);
                expect(`${response.error}`).to.equal('Error: cannot GET /api/products/create-product (403)');
                expect(response.text).to.not.include('        <h1>Create a New Product</h1>\r\n' +
                    '<form action="/api/products" method="post">\r\n' +
                    '    <label for="title">Title:</label>\r\n' +
                    '    <input type="text" id="title" name="title" required>\r\n');
            });
        })

        describe('Test de GET /api/products/delete-product/:id', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestPremium);
                await requester.post('/api/sessions/login').send({
                    email: TestPremium.email,
                    password: TestPremium.password
                });
                this.user = await usersService.findUserByEmail(TestPremium.email)
                await requester.get(`/api/users/premium/${TestPremium.email}`);
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, TestPremium.email);
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestPremium.email);
                await cartsService.removeCart(`${TestPremium.email}_cart`);
            });
            it('GET /api/products/delete-product/:id debería eliminar el producto', async function () {
                const response = await requester.get(`/api/products/delete-product/${this.savedProduct._id}`);
                expect(response.text).to.include(`<center><h3>Se ha eliminado el producto</h3></center>`);
            });
        })

        describe('Test de GET /api/products/delete-product/:id a producto ajeno', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestPremium);
                await requester.post('/api/sessions/login').send({
                    email: TestPremium.email,
                    password: TestPremium.password
                });
                this.user = await usersService.findUserByEmail(TestPremium.email)
                await requester.get(`/api/users/premium/${TestPremium.email}`);
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, TestUser.email);
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestPremium.email);
                await productsService.deleteProduct(this.savedProduct._id.toString())
                await cartsService.removeCart(`${TestPremium.email}_cart`);
            });
            it('GET /api/products/delete-product/:id a producto ajeno NO debería eliminar el producto', async function () {
                const response = await requester.get(`/api/products/delete-product/${this.savedProduct._id}`);
                expect(response.status).to.equal(403);
                expect(response.text).to.equal('No tienes permisos para borrar este producto');
                expect(`${response.error}`).to.equal(`Error: cannot GET /api/products/delete-product/${this.savedProduct._id} (403)`);
                expect(response.text).to.not.include(`<center><h3>Se ha eliminado el producto</h3></center>`);
            });
        })
        
        describe('Test de GET /api/products/delete-product/:id con usuario no premium', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestPremium);
                await requester.post('/api/sessions/login').send({
                    email: TestPremium.email,
                    password: TestPremium.password
                });
                this.user = await usersService.findUserByEmail(TestPremium.email)
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, TestUser.email);
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestPremium.email);
                await productsService.deleteProduct(this.savedProduct._id.toString())
                await cartsService.removeCart(`${TestPremium.email}_cart`);
            });
            it('GET /api/products/delete-product/:id con usuario no premium NO debería eliminar el producto', async function () {
                const response = await requester.get(`/api/products/delete-product/${this.savedProduct._id}`);
                expect(response.statusCode).to.equal(403);
                expect(response.text).to.equal('{"error":"Forbidden"}');
                expect(`${response.error}`).to.equal(`Error: cannot GET /api/products/delete-product/${this.savedProduct._id} (403)`);
                expect(response.text).to.not.include(`<center><h3>Se ha eliminado el producto</h3></center>`);
            });
        })
        
        describe('Test de GET /api/products/', () => {
            beforeEach(async function () {
                await requester.post('/api/sessions/register').send(TestUser);
                await requester.post('/api/sessions/login').send({
                    email: TestUser.email,
                    password: TestUser.password
                });
                this.savedProduct = await productsService.createProduct(newProduct.title, newProduct.description, newProduct.price, newProduct.stock, newProduct.category, newProduct.owner);
                this.secondSavedProduct = await productsService.createProduct(secondNewProduct.title, secondNewProduct.description, secondNewProduct.price, secondNewProduct.stock, secondNewProduct.category, secondNewProduct.owner);
            });
            afterEach(async function () {
                await requester.post('/api/sessions/logout');
                await usersService.deleteUserByEmail(TestUser.email);
                await cartsService.removeCart(`${TestUser.email}_cart`);
                await productsService.deleteProduct(this.savedProduct._id.toString())
                await productsService.deleteProduct(this.secondSavedProduct._id.toString())
            });
            it('GET /api/products/ debe renderizar la información de productos', async function () {
                const response = await requester.get('/api/products/')
                expect(response.statusCode).to.equal(200);
                expect(response.text).to.not.include('<h1>No hay productos para mostrar</h1>');  
            });
        })
    });
})