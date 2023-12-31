// Import necessary modules
let user = require('../models/userModel');
let ProductDB = require('../models/productModel');
let Cart = require('../models/cart');

// Render Cart
let renderCart = async (req, res) => {
    try {

        let userDa = await user.findById(req.session.user_id);
        let cartData = await Cart.findOne({ userid: req.session.user_id }).populate("products.productId");
        let cartTotal = 0;
        let totalamount = 0;
        if (!cartData || !cartData.products || cartData.products.length === 0) {
            return res.render('cart', { userName: req.session.name, cartData: null, totalamount, userDa, datatotal: null, cartTotal: 0 });
        } else {
            cartTotal = cartData.products.reduce((total, product) => {
                return total + (product.productId.price * product.count);
            }, 0);

            totalamount = cartData.products.reduce((total, product) => {
                return total + (product.totalPrice * product.count);
            }, 0);
        }

        let deliveryCharge = (cartTotal < 1000) ? 67 : 0;
        let totalAmount = cartTotal + deliveryCharge;
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
        const productData = await ProductDB.findOne({ _id: productId });

        if (productData && userId) {
            const cartItem = {
                productId: productId,
                count: 1,
                sum: productData.price,
                totalPrice: productData.price,
            };
            let cartData = await Cart.findOne({ userid: userId, "products.productId": productId });

            if (cartData) {
                const updatedCart = await Cart.findOneAndUpdate(
                    { userid: userId, "products.productId": productId },
                    {
                        $inc: { "products.$.count": 1, "products.$.totalPrice": productData.price },
                    },
                    { new: true }
                );
            } else {
                const newCart = await Cart.findOneAndUpdate(
                    { userid: userId },
                    { $set: { userid: userId }, $push: { products: cartItem } },
                    { upsert: true, new: true }
                );
            }

            
            res.json({ success: true, message: "Product added to cart successfully" });
        } else {
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
        const productData = await ProductDB.findOne({ _id: productId ,block:0});
        if (!productData) {
            return res.status(404).json({ success: false, message: 'Product not found or blocked' });
        }
        if (newCount > productData.stock) {
            return res.status(400).json({ success: false, message: 'Invalid quantity or stock exceeded' });
        }
        await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": newCount } }
        );
        const updatedCart = await Cart.findOne({ userid: userId }).populate("products.productId");
        let cartTotal = updatedCart.products.reduce((total, product) => {
            return total + product.productId.price * product.count;
        }, 0);

        let deliveryCharge = (cartTotal < 1000) ? 67 : 0;

        let totalAmount = cartTotal + deliveryCharge;
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
        const userId = req.session.user_id;
        const productId = req.query.id;

        
        const product = await Cart.findOne({ userid: userId, "products.productId": productId });
        if (product) {
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

                return res.redirect('/cart');
            }
        } else {
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
