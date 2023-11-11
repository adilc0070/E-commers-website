const mongoose = require('mongoose');

const addressSchema = mongoose.Schema({
    user: {
        ref: 'user',
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    addresses: [
        {
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
                type: String,
                required: true,
                validate: {
                    validator: function (v) {
                        return /^\d{6}$/.test(v); // Validates a 6-digit pin
                    },
                    message: 'Pin should be a 6-digit number.',
                },
            },
            country: {
                type: String,
            },
            phone: {
                type: String,
                required: true,
                validate: {
                    validator: function (v) {
                        return /^\d{10}$/.test(v); // Validates a 10-digit phone number
                    },
                    message: 'Phone should be a 10-digit number.',
                },
            },
            email: {
                type: String,
                required: true,
                match: /^[^\s@]+@(gmail\.com|icloud\.com|yahoo\.com)$/,
            },
            additional: {
                type: String,
            },
        },
    ],
});

const AddressModel = mongoose.model('address', addressSchema);

module.exports = AddressModel;
