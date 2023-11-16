let mongoose = require('mongoose')
let orderSchema = new mongoose.Schema({
    userId: {
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    products: [
        {
            productId: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],
    amount: {
        type: Number,
        required: true
    },
    address: String,
    status: {
        type: String,
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentId: {
        type: String

    },
    paymentStatus: {
        type: String,

    },
    paymentType: {
        type: String
    },
    paymentDate: {
        type: Date
    },

})


module.exports = mongoose.model('Order', orderSchema)