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
                ref: 'product',
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
            image: {
                type: String,  // Add this field to store the product image
                required: true,
            }
        }
    ],
    amount: {
        type: Number,
        required: true,
    },
    address: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pin: {
            type: Number,
            required: true,
        },
        phone: {
            type: Number,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        additional: {
            type: String,
        }
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
