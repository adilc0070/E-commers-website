// Import necessary modules
let user = require('../models/userModel');
let ProductDB = require('../models/productModel');
let Cart = require('../models/cart');

// Render Cart
let renderCart = async (req, res) => {
    try {
        // Fetch user data and cart data
        let userDa = await user.findById(req.session.user_id);
        let cartData = await Cart.findOne({ userid: req.session.user_id }).populate("products.productId");
        let cartTotal = 0;
        let totalamount = 0;

        // Check if the cart is empty
        if (!cartData || !cartData.products || cartData.products.length === 0) {
            console.log("Your cart is empty.");
            return res.render('cart', { userName: req.session.name, cartData: null, totalamount, userDa, datatotal: null, cartTotal: 0 });
        } else {
            // Calculate the cart total
            cartTotal = cartData.products.reduce((total, product) => {
                return total + (product.productId.price * product.count);
            }, 0);

            // Calculate total amount
            totalamount = cartData.products.reduce((total, product) => {
                return total + (product.totalPrice * product.count);
            }, 0);
        }

        // Calculate the delivery charge based on the cart total
        let deliveryCharge = (cartTotal < 1000) ? 67 : 0;

        // Calculate the total amount including the delivery charge
        let totalAmount = cartTotal + deliveryCharge;
        console.log("Total Amount:", totalAmount, cartTotal, deliveryCharge);

        res.render('cart', { user: req.session.name, cartData, totalamount, userDa, deliveryCharge, totalAmount, cartTotal });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// Add to Cart
const add = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.body.id;
        console.log(userId, productId);
        // Fetch product data from the database
        const productData = await ProductDB.findOne({ _id: productId });

        if (productData && userId) {
            const cartItem = {
                productId: productId,
                count: 1,
                sum: productData.price,
                totalPrice: productData.price,
            };

            // Check if the product is already in the user's cart
            let cartData = await Cart.findOne({ userid: userId, "products.productId": productId });

            if (cartData) {
                // If the product is already in the cart, update the quantity
                const updatedCart = await Cart.findOneAndUpdate(
                    { userid: userId, "products.productId": productId },
                    {
                        $inc: { "products.$.count": 1, "products.$.totalPrice": productData.price },
                    },
                    { new: true }
                );
            } else {
                // If the product is not in the cart, add it to the cart
                const newCart = await Cart.findOneAndUpdate(
                    { userid: userId },
                    { $set: { userid: userId }, $push: { products: cartItem } },
                    { upsert: true, new: true }
                );
            }

            
            res.json({ success: true, message: "Product added to cart successfully" });
        } else {
            // Handle the case where the product is not found
            
            res.status(404).send("Product not found");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// Update Quantity
let updateQuantity = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.body.id;
        const newCount = req.body.quantity;

        // Fetch the product data
        const productData = await ProductDB.findOne({ _id: productId ,block:0});

        // Check if the product data is available
        if (!productData) {
            return res.status(404).json({ success: false, message: 'Product not found or blocked' });
        }

        // Check if the new quantity is valid (non-negative and within stock limits)
        if (newCount > productData.stock) {
            return res.status(400).json({ success: false, message: 'Invalid quantity or stock exceeded' });
        }

        // Update the cart
        await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": newCount } }
        );

        // Fetch the updated cart data
        const updatedCart = await Cart.findOne({ userid: userId }).populate("products.productId");

        // Calculate the new cart total
        let cartTotal = updatedCart.products.reduce((total, product) => {
            return total + product.productId.price * product.count;
        }, 0);

        // Calculate the new delivery charge based on the updated cart total
        let deliveryCharge = (cartTotal < 1000) ? 67 : 0;

        // Calculate the new total amount including the delivery charge
        let totalAmount = cartTotal + deliveryCharge;

        // Send a success response with the updated cart data
        return res.json({
            success: true,
            message: 'Quantity updated successfully',
            updatedCart,
            totalAmount
        });
    } catch (error) {
        console.error(error.message);
        // Send an error response with a message
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




// Delete Cart Item
let deleteCart = async (req, res) => {
    try {
        console.log('Reached deleteCart route');
        const userId = req.session.user_id;
        const productId = req.query.id;

        // Find the product in the cart
        const product = await Cart.findOne({ userid: userId, "products.productId": productId });
        if (product) {
            // Delete the product and return the updated cart
            const updatedCart = await Cart.updateOne(
                { userid: userId },
                { $pull: { products: { productId: productId } } }
            );
        }

        res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// Buy Now
const buyNow = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.id;

        const productData = await ProductDB.findOne({ _id: productId });
        const cartData = await Cart.findOne({ userid: userId, "products.productId": productId });

        if (userId && productData) {
            if (cartData) {
                // Product is already in the cart
                return res.json({ alreadyAdded: true });
            } else {
                const cartItem = {
                    productId: productId,
                    count: 1,
                    totalPrice: productData.price,
                };

                await Cart.findOneAndUpdate(
                    { userid: userId },
                    { $set: { userid: userId }, $push: { products: cartItem } },
                    { upsert: true }
                );

                // Redirect to the cart page for the "Buy Now" functionality
                return res.redirect('/cart');
            }
        } else {
            // Handle invalid request parameters
            console.log("Invalid request parameters");
            return res.status(400).send("Bad Request");
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
};

// Order Page
let orderPage = async (req, res) => {
    try {
        let userDa = await user.findById(req.session.user_id);
        let cartData = await Cart.findOne({ userid: req.session.user_id }).populate("products.productId");
        res.render('orderDetails', { user: req.session.name, cartData, userDa });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// Export the functions
module.exports = {
    add,
    renderCart,
    buyNow,
    deleteCart,
    updateQuantity,
    
};
