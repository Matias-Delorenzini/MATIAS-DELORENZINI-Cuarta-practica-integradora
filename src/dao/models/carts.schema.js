import mongoose from 'mongoose';

const cartCollection = "carts";
const CartSchema = new mongoose.Schema({
    cartId: {
        type: String,
        required: true
    },
    products: {
        type: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "products",
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
            }
        ],
        default: [],
    },
});

CartSchema.pre("find", function () {
    this.populate("products.product");
});

CartSchema.pre("findOne", function () {
    this.populate("products.product");
});

const CartsModel = mongoose.model(cartCollection, CartSchema);
export default CartsModel;
