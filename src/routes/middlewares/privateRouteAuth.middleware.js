export function privateRouteAuth(req, res, next) {
    try {
        if (req.session.user) {
            res.redirect("/profile");
        } else {
            next();
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}