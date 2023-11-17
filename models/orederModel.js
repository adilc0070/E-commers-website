const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                default: 1,
            },
            product_name: {
                type: String,  // Add this field to store the product name
                required: true,
            },
        }
    ],
    amount: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    paymentId: {
        type: String,
    },
    paymentStatus: {
        type: String,
    },
    paymentType: {
        type: String,
    },
    paymentDate: {
        type: Date,
    },
});

module.exports = mongoose.model('Order', orderSchema);
