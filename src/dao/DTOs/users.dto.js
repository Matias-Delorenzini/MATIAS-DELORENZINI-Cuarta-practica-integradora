import config from "../../config/config.js";
import { isValidPassword } from "../../utils/utils.js";


export default class UsersDTO {
    
    constructor(user) {
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.age = user.age;
        this.email = user.email;
        this.cart = user.cart;
        this.role = user.role;

        if (user.email === config.adminEmail && isValidPassword(user, config.adminPassword)) {
            this.isAdmin = true;
        } else {
            this.isAdmin = false;
        }
    }
}
