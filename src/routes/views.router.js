import express from 'express';
import { publicRouteAuth } from './middlewares/publicRouteAuth.middleware.js';
import { privateRouteAuth } from './middlewares/privateRouteAuth.middleware.js';
const router = express.Router();

router.get("/register", privateRouteAuth, (req, res) => {
    try {
        res.render("register");
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/login", privateRouteAuth, (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/profile", publicRouteAuth, (req, res) => {
    try {
        const userData = req.session.user;
        res.render('profile', { userData });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/recover', async (req, res) => {
    try {
        res.render("recover");
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
