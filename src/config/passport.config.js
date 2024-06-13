import passport from "passport";
import local from "passport-local";
import { createHash, isValidPassword } from "../utils/utils.js";
import { usersService } from "../repositories/index.js";
import { cartsService } from "../repositories/index.js";
import { CustomError } from "../services/errors/errors.js";
import { logger } from '../utils/logger.js';

const LocalStrategy = local.Strategy;
const initializePassport = () => {

    passport.use("register", new LocalStrategy(
        {passReqToCallback:true, usernameField:"email"}, async (req, username, password, done) => {
            const {first_name,last_name,email,age} = req.body
            try{
                logger.debug(`first_name: ${first_name}`)
                logger.debug(`last_name: ${last_name}`)
                logger.debug(`email: ${email}`)
                logger.debug(`age: ${age}`)

                const user = await usersService.findUserByEmail(username); 
                logger.debug(`Si esto es igual a null, el usuario no existe y se registrará: ${user}`);
                if(user){
                    logger.debug("El usuario ya existe")
                    return done(null,false);
                }
                const newUser = {
                    first_name,
                    last_name,
                    email,
                    age,
                    cart: email+"_cart",
                    password:createHash(password)
                }
                const cartId = newUser.cart

                let cartResult = await cartsService.createNewUserCart(cartId);
                if (cartResult.success === false) throw new CustomError(`${cartResult.message}`);
            
                let result = await usersService.createUser(newUser); 
                logger.debug(`Usuario ${newUser.email} registrado`);
                return done(null,result,cartResult);
            }catch(error){
                return done("Error al crear el usuario: " + error);
            }
        }
    ))

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await usersService.findUserByEmail(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
    

    passport.use("login", new LocalStrategy({usernameField: "email"}, async (username, password, done) => {
        try {
            const user = await usersService.findUserByEmail(username);
            if (!user) {
                logger.debug("El usuario no existe");
                return done(null, false);
            }    
            if (!isValidPassword(user, password)) return done(null, false);
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));
    
}
export default initializePassport;
