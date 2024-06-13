import Users from "../dao/mongo/users.mongo.js";
import Carts from "../dao/mongo/carts.mongo.js";
import Products from "../dao/mongo/products.mongo.js";
import Tickets from "../dao/mongo/tickets.mongo.js";

import UsersRepository from "./users.repository.js";
import CartsRepository from "./carts.repository.js";
import ProductsRepository from "./products.repository.js";
import TicketsRepository from "./tickets.repository.js";

export const usersService = new UsersRepository(new Users());
export const cartsService = new CartsRepository(new Carts());
export const productsService = new ProductsRepository(new Products());
export const ticketsService = new TicketsRepository(new Tickets());