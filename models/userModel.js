const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        default: 'profile.png'
    },
    email: {
        type: String,
        required: true,
    
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
    },
    is_block: {
        type: Number,
        default: 0
    },
    verified: {
        type: Number,
        default: 1
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;