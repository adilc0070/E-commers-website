// Import necessary modules
let user = require('../models/userModel');
let ProductDB = require('../models/productModel');
let Cart = require('../models/cart');
let Order = require('../models/orederModel');
let address = require('../models/address');
let Razorpay = require('razorpay');



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
        console.log("Place Order");
        let { addressId, amount, paymentMethod } = req.body;
        // console.log('Address:', addressId, 'Amount:', amount, 'Payment Method:', paymentMethod);
    
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
        // console.log('Address:', deliveryAddress.addresses[0]);
    
        // Check if the address is found
        if (!deliveryAddress) {
            return res.status(404).json({ success: false, message: 'Delivery address not found' });
        }else{
            // Example: Create an order document in the database
            let order = new Order({
                userId: req.session.user_id,
                address: {
                    firstName: deliveryAddress.addresses[0].firstName,
                    lastName: deliveryAddress.addresses[0].lastName,
                    address: deliveryAddress.addresses[0].address,
                    city: deliveryAddress.addresses[0].city,
                    state: deliveryAddress.addresses[0].state,
                    pin: deliveryAddress.addresses[0].pin,
                    phone: deliveryAddress.addresses[0].phone,
                    email: deliveryAddress.addresses[0].email,
                    additional: deliveryAddress.addresses[0].additional,
                }, // Use the first (and only) address in the array
                products: orderProducts,
                amount: amount,
                paymentType: paymentMethod,
            });

            await order.save();
        
            // Clear the user's cart after placing the order
            await Cart.updateOne({ userid: req.session.user_id }, { $set: { products: [] } });

            if(paymentMethod === 'COD'){

                res.json({ success: true, message: 'Order placed successfully' });
            }else{

            }
        
            res.json({ success: true, message: 'Order placed successfully' });                                      
        }
    
        
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
        let orders = await Order.find({ userId: req.session.user_id }).populate('products.productId');
        
        // console.log(orders);
        res.render('orderDetails', { userDa, orders });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        // console.log('change order status')
            const id = req.params.id
            // console.log(id)
            const status = req.body.newStatus;
            // console.log(status)
        
            const change = await Order.updateOne(
              { _id: id },
              { $set: { status: status } }
            );
            if(change.status=="delivered"){
                let paymentStatus=await Order.updateOne(
                    { _id: id },
                    { $set: { paymentStatus: "paid" } }
                )
            }else if(change.status=="cancelled"){
                let paymentStatus=await Order.updateOne(
                    { _id: id },
                    { $set: { paymentStatus: "cancelled" } }
                )
            }else if(change.status=="shipped"){
                let paymentStatus=await Order.updateOne(
                    { _id: id },
                    { $set: { paymentStatus: "pending" } }
                )
            }else if(change.status=="pending"){
                let paymentStatus=await Order.updateOne(
                    { _id: id },
                    { $set: { paymentStatus: "pending" } }
                )
            }

        
            // console.log(change)
            if(change){
               res.json({
                 success: true,
                 message: "Order status updated successfully",
                 order: updatedOrder,
               });
            }
            
          }catch (error){
        res
          .status(500)
          .json({ success: false, message: "Error updating order status" });
          }
};
let cancelOrder = async (req, res) => {
    try {
        const id= req.body.orderId;
        let order = await Order.findById(id);
        if(order){
            await Order.updateOne({ _id: id }, { $set: { status: "cancelled" } });
            res.json({success: true, message: 'Order cancelled successfully.'});
            // console.log("Reached cancelOrder")
        }

    }catch(error){
        console.log(error.message);
        res.status(500).send(error.message);
    }
}

module.exports = {
    checkoutPage,
    orderPage,
    placeOrder,
    updateOrderStatus,
    cancelOrder
}