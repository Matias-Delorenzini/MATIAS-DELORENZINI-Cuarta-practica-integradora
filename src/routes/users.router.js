import express from 'express';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
import { usersService } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import upload from './middlewares/upload.middleware.js';
import { authorize } from './middlewares/authorize.middleware.js';
import config from '../config/config.js';
const router = express.Router();

router.get("/premium/:uid", publicRouteAuth, authorize(["user", "premium"]), async (req, res) => {
    try {
        const email = req.params.uid;
        const user = await usersService.findUserByEmail(email)

        if (user.role === "premium") {
            const result = await usersService.updateUserRole(email,"user")
            req.session.user.role = "user"
            logger.debug(req.session.user.role)

            return res.send(
                `<html>
                    <body>
                        <center>
                            <h4>Role cambiado a user</h4>
                            <h4><a href="http://localhost:${config.port}">Volver al menu</a></h4>
                        </center>
                    </body>
                </html>`
            )
        };

        const requiredDocuments = [
            { name: `${user.email}-identificacion.pdf`, reference: `/public/documents/identificacion/${user.email}-identificacion.pdf` },
            { name: `${user.email}-comprobante_de_domicilio.pdf`, reference: `/public/documents/comprobante_de_domicilio/${user.email}-comprobante_de_domicilio.pdf` },
            { name: `${user.email}-comprobante_de_estado_de_cuenta.pdf`, reference: `/public/documents/comprobante_de_estado_de_cuenta/${user.email}-comprobante_de_estado_de_cuenta.pdf` }
        ];

        if (user.documents.length < 3) return res.send(
            `<html>
                <body>
                    <center>
                        <h3>Para procesar tu solicitud de cuenta premium necesitamos que cargues todos los datos requeridos</h3>
                        <p>Datos cargados:</p>
                        <ul>
                            ${user.documents.map(doc => `<li>${doc.name}</li>`).join('')}
                        </ul>
                        <a href="http://localhost:${config.port}/api/users/upload-documents">Cargar datos personales</a>
                        <a href="http://localhost:${config.port}">Volver al menu</a>
                    </center>
                </body>
            </html>`
        );

        for (const requiredDoc of requiredDocuments) {
            const exists = user.documents.some(doc => doc.name === requiredDoc.name && doc.reference === requiredDoc.reference);
            if (!exists) {
                return res.send(
                    `<html>
                        <body>
                            <center>
                                <h3>Para procesar tu solicitud de cuenta premium necesitamos que cargues todos los datos requeridos</h3>
                                <p>Datos cargados:</p>
                                <ul>
                                    ${user.documents.map(doc => `<li>${doc.name}</li>`).join('')}
                                </ul>
                                <a href="http://localhost:${config.port}/api/users/upload-documents">Cargar datos personales</a>
                                <a href="http://localhost:${config.port}">Volver al menu</a>
                            </center>
                        </body>
                    </html>`
                );
            }
        }

        if (user.role === "user") {
            const result = await usersService.updateUserRole(email,"premium")
            req.session.user.role = "premium"
            logger.debug(req.session.user.role)

            return res.send(
                `<html>
                    <body>
                        <center>
                            <h4>Role cambiado a premium</h4>
                            <h4><a href="http://localhost:${config.port}">Volver al menu</a></h4>
                        </center>
                    </body>
                </html>`
            )
        };

        if (user.role !== "user" && user.role !== "premium") return res.send("No deberías poder cambiar tu rol ¿Cómo llegaste aquí?")
        
    } catch (error) {
        logger.error("Error en /register endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/upload-documents", publicRouteAuth, async (req, res) => {
    try {
        const user = req.session.user
        if (user.role === "premium") return res.redirect(`http://localhost:8080/api/users/premium/${user.email}`)
        res.render('upload-documents', { user });
    } catch (error) {
        logger.error("Error en /register endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:uid/documents', publicRouteAuth, async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const user = req.session.user;
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const documents = {};

            if (req.files['identificacion']) {
                documents.identificacion = req.files['identificacion'][0].filename;
                await usersService.updateUserDocuments(user.email,'identificacion');
            }
            if (req.files['comprobante_de_domicilio']) {
                documents.comprobanteDeDomicilio = req.files['comprobante_de_domicilio'][0].filename;
                await usersService.updateUserDocuments(user.email,'comprobante_de_domicilio');
            }
            if (req.files['comprobante_de_estado_de_cuenta']) {
                documents.comprobanteDeEstadoDeCuenta = req.files['comprobante_de_estado_de_cuenta'][0].filename;
                await usersService.updateUserDocuments(user.email,'comprobante_de_estado_de_cuenta');
            }

            res.send(
                `<html>
                    <body>
                        <center>
                            <a href="http://localhost:${config.port}">Volver al menu</a><br>
                            <a href="http://localhost:${config.port}/api/users/upload-documents">Cargar más datos personales</a><br>
                            <a href="http://localhost:${config.port}/api/users/premium/${user.email}">Solicitar cuenta premium</a>
                        </center>
                    </body>
                </html>`
            );
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});


export default router;