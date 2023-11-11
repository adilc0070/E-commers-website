let user = require('../models/userModel')
let ProductDB = require('../models/productModel')
let category = require('../models/catogoryModel')
const Cart = require('../models/cart')

// +++++++++++++++++++++++++++++RENDER CART+++++++++++++++++++++++++++++++++
let renderCart = async (req, res) => {
  try {
      let userDa = await user.findById(req.session.user_id);
      let cartData = await Cart.findOne({ userid: req.session.user_id }).populate("products.productId");
      let totalamount = 0;

      if (!cartData || !cartData.products || cartData.products.length === 0) {
          console.log("Your cart is empty.");
          return res.render('cart', { user: req.session.name, cartData: null, totalamount, userDa,datatotal });
      } else if (cartData) {
          var datatotal = cartData.products.map((products) => {
              return products.totalPrice * products.count;
          });

          // Calculate total amount
          if (datatotal.length > 0) {
              totalamount = datatotal.reduce((x, y) => {
                  return x + y;
              });
          }
      }

      res.render('cart', { user: req.session.name, cartData, totalamount, userDa, datatotal });
  } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
};

// +++++++++++++++++++++++++++++ADD TO CART+++++++++++++++++++++++++++++++++
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.id;

    const productData = await product.findOne({ _id: productId });

    const cartData = await Cart.findOne({ userid: userId, "products.productId": productId });

    if (userId) {
      if (productData.quantity > 1) {
        if (cartData) {
          await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": 1 } }
          );
       // Product is already in the cart
          console.log("Cart product count increased");
          res.json({ alreadyAdded: true }); 
        } else {
          const cartItem = {
            productId: productId,
            count: 1,
            totalPrice: productData.price ,
          };
          
         const newCart = await Cart.findOneAndUpdate(
            { userid: userId },
            { $set: { userid: userId }, $push: { products: cartItem } },
            { upsert: true, new: true }
          );
          console.log('newCart'+newCart);
          console.log("product added to the cart");
          res.json({ result: true });
        }
      } else {
        res.json({ result: false });
      }
    } else {
      console.log("Login required");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const buyNow = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.params.id;

    const productData = await ProductDB.findOne({ _id: productId });

    const cartData = await Cart.findOne({ userid: userId, "products.productId": productId });

    if (userId) {
      if (productData.quantity > 1) {
        if (cartData) {
          // Product is already in the cart
          console.log("Cart product count increased");
          res.json({ alreadyAdded: true });
        } else {
          const cartItem = {
            productId: productId,
            count: 1,
            totalPrice: productData.price,
          };

          const newCart = await Cart.findOneAndUpdate(
            { userid: userId },
            { $set: { userid: userId }, $push: { products: cartItem } },
            { upsert: true, new: true }
          );

          // Redirect to the cart page for the "Buy Now" functionality
          res.redirect('/cart');
        }
      } else {
        res.json({ result: false });
      }
    } else {
      console.log("Login required");
    }
  } catch (error) {
    console.log(error.message);
  }
};


// +++++++++++++++++++++++++++++ADD QUANTITY TO CART+++++++++++++++++++++++++++++++++

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.id;
    const val = req.body.val;

    const productData = await product.findOne({ _id: productId });

    if (productData.quantity > 0) {
      const cartData = await Cart.findOne({ userid: userId, "products.productId": productId });
      const currentCount = cartData.products.find(item => item.productId === productId).count;

      if (val === 1) {
        if (currentCount < productData.quantity) {
          await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": 1 } });

          console.log("Count increased");
          res.json({ result: true });
        } else {
          // Display a "stock exceeded" alert
          res.json({ result: "stock_exceeded" });
        }
      } else if (val === -1) {
        if (currentCount > 0) {
          await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": -1 } });

          console.log("Count decreased");
          res.json({ result: true });
        } else {
          // Handle the case when the count is already 0
          res.json({ result: "count_already_zero" });
        }
      }
    } else {
      // Display SweetAlert if the product is out of stock
      res.json({ result: "out_of_stock" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// +++++++++++++++++++++++++++++DELETE PRODUCT FROM CART+++++++++++++++++++++++++++++++++

// const deleteCartProduct = async(req ,res) =>{
//   try{
//     const productId = req.query.id
//     const userId = req.session.user_id;
  
//   const cartData = await Cart.updateOne(
//     { userid: userId },
//     { $pull: { products: { productId: productId } } }
//   );
//   if(cartData){
//     res.redirect('/cart');
//     }
//     else{
//      console.log("error");
//     }
     
// }
// catch (error) {
//   console.log(error.message);
  
// }
// }
const deleteCartProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const userId = req.session.user_id;

  
    const cartData = await Cart.findOneAndUpdate(
      { userid: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
     );
    if(cartData){
      res.redirect('/cart');
    }
   else {
    console.log("No matching items found in the cart.");
    // You might want to handle this case differently, e.g., display an error message.
    res.redirect('/cart');
   }
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately, e.g., display an error page.
    res.status(500).json({ error: 'Internal server error' });
  }
};


  
module.exports = {
    
    addToCart, 
    updateCartQuantity,
    deleteCartProduct,
    renderCart,
    buyNow
}