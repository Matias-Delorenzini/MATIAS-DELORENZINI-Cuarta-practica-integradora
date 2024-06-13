import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fakerES as faker } from '@faker-js/faker';
import pkg from 'bcrypt';

export const generateProduct = () =>{
    return {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.number.int({ min: 1, max: 100 }),
        stock: faker.number.int({ min: 0, max: 50 })
    }
}

export const createHash = password => pkg.hashSync(password, pkg.genSaltSync(10));

export const isValidPassword = (user, password) => pkg.compareSync(password, user.password);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;

console.log(__dirname)
console.log(__filename)