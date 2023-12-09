// Import necessary modules
let user = require('../models/userModel');
let ProductDB = require('../models/productModel');
let Cart = require('../models/cart');
let Order = require('../models/orederModel');
let address = require('../models/address');
let Razorpay = require('razorpay');
let fs = require('fs');
let pdf=require('html-pdf')
let path=require('path')
let ejs=require('ejs')



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
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAYKEY,
    key_secret: process.env.RAZORPAYSECRET,
  });



let placeOrder = async (req, res) => {
    try {
        // console.log("Place Order");
        let { addressId, amount, paymentMethod } = req.body;
        console.log('Address:', addressId, 'Amount:', amount, 'Payment Method:', paymentMethod);
    
        // Check if the required fields are provided
        if (!addressId || !amount || !paymentMethod) {
            // console.log("Required fields are missing");
            return res.status(400).json({ success: false, message: 'Address, amount, and paymentMethod are required fields.' });
        }
    
        let cartData = await Cart.findOne({ userid: req.session.user_id });
        let userDa = await user.findById(req.session.user_id);
        let products = await ProductDB.find({ _id: { $in: cartData.products.map(item => item.productId) } });
    
        // Check if the product stock is sufficient for the order
        for (let i = 0; i < products.length; i++) {
            if (cartData.products[i].count > products[i].stock) {
                // console.log("Insufficient stock for product:", products[i].product_name);
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
                product_name: products[i].product_name,
                image: products[i].images.image1
            });
        }
    
        // Find the delivery address
        let deliveryAddress = await address.findOne({ 'addresses._id': addressId, 'user': req.session.user_id });
        // console.log('Address:', deliveryAddress.addresses[0]);
    
        // Check if the address is found
        if (!deliveryAddress) {
            // console.log("Delivery address not found");
            return res.status(404).json({ success: false, message: 'Delivery address not found' });
        }else{
            // console.log("Delivery address found:", deliveryAddress.addresses[0]);
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

            let savedOrder = await order.save();
            // console.log("Saved Order:", savedOrder);
        
            // Clear the user's cart after placing the order
            
            if(paymentMethod === 'COD'){
                res.json({ success: true, message: 'Order placed successfully' });
                await Cart.updateOne({ userid: req.session.user_id }, { $set: { products: [] } });
            }else if(savedOrder.paymentType == 'paypal'){
                await Cart.updateOne({ userid: req.session.user_id }, { $set: { products: [] } });
                // console.log("paypal method");
                const options = {
                    amount: savedOrder.amount * 100, // Amount should be in paise
                    currency: 'INR',
                    receipt: savedOrder._id,
                    payment_capture: 1, // Automatically capture the payment
                  };
                  
                  razorpay.orders.create(options, (err, order) => {
                    if (err) {
                        throw new Error('something went wrong, try again later');
                    } else {
                        // console.log("orders :", order);
                        res.json({ order });
                    }
                  });
            }
        
            // res.json({ success: true, message: 'Order placed successfully' });                                      
        }
    
        
    }  catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const createOrder = async (req, res) => {
    try {
      const userDa = req.session.user_id;
      const total = await Cart.find({ userid: userDa }).populate("products.productId")

      const datatotal = total[0].products.map((item) => {
        return item.totalPrice;
      })
  
      let totalsum = 0;
      if (datatotal.length > 0) {
        totalsum = datatotal.reduce((x, y) => {
          return x + y;
        });
      }
      console.log(totalsum);
  
      console.log("create order");
      const options = {
        amount: totalsum * 100, // Amount in smallest currency unit (e.g., paisa)
        currency: "INR", // Currency code
        receipt: order_rcptid_$(Math.floor(Math.random() * 1000)),

      };
      console.log("create order222");
      const order = await Razorpay.orders.create(options);
      console.log(order, ";aosdfhasjf");
      res.json(order);
    } catch (error) {
      res.status(500).send(error);
    }
  };
  
  //==========================Verify order =========================
  const verifypayment = async (req, res) => {
    try {
      console.log("verifff");
  
      const user_id = req.session.user_id;
      const paymentData = req.body;
      const cartData = await Cart.find({ userid: user_id });
  
      console.log(
        "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
      );
  
      console.log(cartData);
  
      const hmac = crypto.createHmac("sha256", process.env.key_secret);
      hmac.update(
        paymentData.payment.razorpay_order_id +
          "|" +
          paymentData.payment.razorpay_payment_id
      );
      console.log(hmac);
      const hmacValue = hmac.digest("hex");
      if (hmacValue === paymentData.payment.razorpay_signature) {
        //     const productIds = cartData.products.map((product) => product.productId);
        // console.log("Product IDs:", productIds);
        //       await product.findByIdAndUpdate(
        //         { _id: productIds },
        //         { $inc: { quantity: -count } })
  
        // await Order.findByIdAndUpdate(
        //   { _id: paymentData.order.receipt },
        //   {
        //     $set: {
        //       paymentStatus: "placed",
        //       paymentId: paymentData.payment.razorpay_payment_id,
        //     },
        //   }
        // );
  
        // await Cart.deleteOne({ userid: user_id });
        console.log("XP 9");
        res.json({ placed: true });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

// Order Page

let orderPage = async (req, res) => {
    try {
        // Fetch user data and orders with pagination
        let userDa = await user.findById(req.session.user_id);
        
        const page = +req.query.page || 1; // Get the page from the query parameter or default to 1
        const ITEMS_PER_PAGE = 5; // Adjust the number of items per page as needed

        const totalOrders = await Order.countDocuments({ userId: req.session.user_id });
        const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

        const orders = await Order.find({ userId: req.session.user_id })
            .populate('products.productId')
            .sort({ date: -1 })
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        res.render('tailes', { userDa, orders, currentPage: page, totalPages });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};

let order = async (req, res) => {
    try {
        // Fetch user data and orders
        let userDa = await user.findById(req.session.user_id); // Corrected: 'user' to 'User'
        let orders = await Order.find({ userId: req.session.user_id }).populate('products.productId').sort({ createdAt: -1 });
        
        // console.log(orders);
        res.render('orders', { userDa, orders });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};

let downloadInvoice = async (req, res) => {
    try {
        const id = req.query.id;
        let userDa=await user.findById(req.session.user_id);
        const orders = await Order.findById(id).populate('products.productId').populate( { path: 'userId', select: 'name' });
        
        if (!orders) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }else{
            ejs.renderFile(
                path.join(__dirname, "../views/user/", "invoice.ejs"),
                {
                    orders,
                },(err, data) => {
                    if (err) {
                        res.send(err);
                    } else {
                        let options = {
                            height: "11.693in",
                            width: "8.268in",
                            header: {
                                height: "0mm",
                            },
                            footer: {
                                height: "0mm",
                            },
                        };
                        pdf.create(data, options).toFile("invoice.pdf", function (err, data) {
                            if (err) {
                                res.send(err);
                            } else {
                                const file = path.join(__dirname, "../invoice.pdf");
                                res.download(file);
                            }
                        });
                    }
                }
            )
            res.render('invoice', { orders, userDa });
            
        }
    } catch (error) {
        console.log(error.message);
    }
}

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
                    { $set: { paymentStatus: "paid" ,
                    paymentDate:new Date()} }
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
        let counts=order.products
        // console.log(counts);
        if(order){
            for(let i=0;i<counts.length;i++){
                let product=await ProductDB.findById(counts[i].productId)
                await ProductDB.updateOne({_id:counts[i].productId},{
                    $inc:{
                        stock:counts[i].quantity
                    }
                })
                // console.log("Reached cancelOrder for loop "+product.product_name);
            }
            await Order.updateOne({ _id: id }, { $set: { status: "cancelled" } });
            res.json({success: true, message: 'Order cancelled successfully.'});
            // console.log("Reached cancelOrder")
        }

    }catch(error){
        console.log(error.message);
        res.status(500).send(error.message);
    }
}

let report=async(req,res)=>{
    try{
        res.render('report')
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
    cancelOrder,
    order,
    downloadInvoice,
    report
}