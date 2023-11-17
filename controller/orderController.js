// Import necessary modules
let user = require('../models/userModel');
let ProductDB = require('../models/productModel');
let Cart = require('../models/cart');
let Order = require('../models/orederModel');
let address = require('../models/address');


let checkoutPage = async (req, res) => {
    try {
        let cartData = await Cart.findOne({ userid: req.session.user_id });
        let userDa = await user.findById(req.session.user_id);
        let addresses = await address.find({ user: req.session.user_id });
        
        // Calculate the cart total
        let cartTotal = 0;
        if (cartData && cartData.products && cartData.products.length > 0) {    
            cartData.products.forEach(product => {
                cartTotal += product.sum * product.count;
            });
        }

        // Calculate the delivery charge based on the cart total
        let deliveryCharge = (cartTotal < 1000) ? 67 : 0;

        // Calculate the total amount including the delivery charge
        let totalAmount = cartTotal + deliveryCharge;

        res.render("checkout", { userDa, addresses, cartData, cartTotal, deliveryCharge, totalAmount });
    } catch (error) {
        console.log(error.message);
    }
};

let placeOrder = async (req, res) => {
    try {
        let { addressId, amount, paymentMethod } = req.body;
        console.log('Address:', addressId, 'Amount:', amount, 'Payment Method:', paymentMethod);
    
        // Check if the required fields are provided
        if (!addressId || !amount || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Address, amount, and paymentMethod are required fields.' });
        }
    
        let cartData = await Cart.findOne({ userid: req.session.user_id });
        let userDa = await user.findById(req.session.user_id);
        let products = await ProductDB.find({ _id: { $in: cartData.products.map(item => item.productId) } });
    
        // Check if the product stock is sufficient for the order
        for (let i = 0; i < products.length; i++) {
            if (cartData.products[i].count > products[i].stock) {
                return res.status(400).json({ success: false, message: 'Insufficient stock for some products in the order' });
            }
        }
    
        // Update product stock and create an order
        // Example: Create an order document in the database
        let orderProducts = [];
        for (let i = 0; i < products.length; i++) {
            // Update product stock
            let updatedStock = products[i].stock - cartData.products[i].count;
            await ProductDB.updateOne({ _id: products[i]._id }, { $set: { stock: updatedStock } });

            // Add product to order with product_name
            orderProducts.push({
                productId: products[i]._id,
                quantity: cartData.products[i].count,
                product_name: products[i].product_name, // Add this line
            });
        }
    
        // Find the delivery address
        let deliveryAddress = await address.findOne({ 'addresses._id': addressId, 'user': req.session.user_id });
    
        // Check if the address is found
        if (!deliveryAddress) {
            return res.status(404).json({ success: false, message: 'Delivery address not found' });
        }
    
        // Example: Create an order document in the database
        let order = new Order({
            userId: req.session.user_id,
            address: deliveryAddress.addresses[0], // Use the first (and only) address in the array
            products: orderProducts,
            amount: amount,
            paymentMethod: paymentMethod,
        });

        await order.save();
    
        // Clear the user's cart after placing the order
        await Cart.updateOne({ userid: req.session.user_id }, { $set: { products: [] } });
    
        res.json({ success: true, message: 'Order placed successfully' });
    }  catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
// Order Page
let orderPage = async (req, res) => {
    try {
        // Fetch user data and orders
        let userDa = await user.findById(req.session.user_id); // Corrected: 'user' to 'User'
        let orders = await Order.find({ userId: req.session.user_id })
            .populate('products.productId');

        res.render('orderDetails', { userDa, orders });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;

        if (!orderId || !newStatus) {
            return res.status(400).json({ success: false, message: 'orderId and newStatus are required fields.' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        order.status = newStatus;
        await order.save();

        return res.json({ success: true, message: 'Order status updated successfully.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    checkoutPage,
    orderPage,
    placeOrder,
    updateOrderStatus
}