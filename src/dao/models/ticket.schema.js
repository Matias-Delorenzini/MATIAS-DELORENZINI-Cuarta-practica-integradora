import mongoose from 'mongoose';
import randomUniqueId from 'random-unique-id';

const ticketsCollection = "tickets";
const TicketsSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        default: randomUniqueId().id
    },
    purchase_datetime: {
        type: Date,
        required: true,
        default: Date.now,
    },
    amount: {
        type: Number,
        required: true,
    },
    purchaser: {
        type: String,
        required: true,
    }
});

const TicketsModel = mongoose.model(ticketsCollection,TicketsSchema);
export default TicketsModel;