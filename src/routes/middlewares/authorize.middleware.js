export function authorize(roles) {
    return (req, res, next) => {
        const role = req.session.user.role
        console.log("User in session middleware authorize: ", req.session.user)
        if (!req.session.user || !roles.includes(role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}