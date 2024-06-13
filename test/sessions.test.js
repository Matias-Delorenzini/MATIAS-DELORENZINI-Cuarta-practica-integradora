import supertest from "supertest";
import { expect } from 'chai';
import mongoose from "mongoose";

import config from '../src/config/config.js';

import { usersService } from '../src/repositories/index.js';
import { cartsService } from '../src/repositories/index.js';

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
})