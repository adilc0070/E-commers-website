let mongoose = require("mongoose");
let walletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: "User",
    },
    balance: {
        type: Number,
        required: true
    },
    transactionHistory: [
        {
            date: {
                type: Date,
                default: Date.now
            },
            amount: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                default: "deposit",
                required: true
            },
            status: {
                type: String,
                default: "success",
                required: true
            }
        }

    ]
})

module.exports = mongoose.model("Wallet", walletSchema)