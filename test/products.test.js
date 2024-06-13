import supertest from "supertest";
import { expect } from 'chai';
import mongoose from "mongoose";

import config from '../src/config/config.js';

import { usersService } from '../src/repositories/index.js';
import { cartsService } from '../src/repositories/index.js';
import { productsService } from '../src/repositories/index.js';

const requester = supertest.agent(`http://localhost:${config.port}`);

describe('Testing con supertest del módulo de products del ecommerce de Matias Delorenzini', function () {
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