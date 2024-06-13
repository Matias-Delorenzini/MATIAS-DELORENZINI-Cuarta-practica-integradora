import express from 'express';
import passport from 'passport';
import { usersService } from './../repositories/index.js';
import { logger } from '../utils/logger.js';
const router = express.Router();

router.get("/current", (req, res) => {
    try {
        logger.debug(req.session)
        if (req.session.user) {
            logger.debug("La sesión existe")
            res.status(200).json({ user: req.session.user });
        } else {
            logger.debug("La sesión NO existe")
            res.status(401).json({ error: "Unauthorized" });
        }
    } catch (error) {
        logger.error("Error en /current endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/register", passport.authenticate("register", { failureRedirect: "/api/sessions/failregister" }), async (req, res) => {
    try {
        res.redirect("/login");
    } catch (error) {
        logger.error("Error en /register endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/failregister", async (req, res) => {
    try {
        logger.info("Failed Strategy");
        res.redirect("/register");
    } catch (error) {
        logger.error("Error en /failregister endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/login", passport.authenticate("login", { failureRedirect: "/api/sessions/faillogin" }), async (req, res) => {
    try {
        if (!req.user) return res.status(400).send({ status: "error", error: "Invalid credentials" });

        req.session.user = await usersService.createUserSession(req.user);
        logger.debug(`${req.session.user.email} loggeado correctamente`)
        const result = await usersService.updateLastConnection(req.session.user.email)
        logger.info(result)
        res.redirect("/api/products");
    } catch (error) {
        logger.error("Error en /login endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/faillogin", (req, res) => {
    try {
        res.redirect("/login");
    } catch (error) {
        logger.error("Error en /faillogin endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/logout", async (req, res) => {
    try {
        logger.debug(req.session)
        const emailToUpdate = req.session.user.email;
        req.session.destroy(err => {
            if (err) {
                logger.error("Error al hacer logout", err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        logger.debug('Session cerrada');
        const result = await usersService.updateLastConnection(emailToUpdate);
        logger.info(result);    
        res.redirect("/login");
    } catch (error) {
        logger.error("Error en /logout endpoint", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;