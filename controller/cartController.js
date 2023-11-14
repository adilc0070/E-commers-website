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
          return res.render('cart', { userName: req.session.name, cartData: null, totalamount, userDa,datatotal });
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
// const addToCart = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const productId = req.body.productId;

//     if (userId && productId) {
//       const productData = await ProductDB.findOne({ _id: productId });

//       if (productData.quantity > 0) {
//         // Define cartItem here
//         const cartItem = {
//           productId: productId,
//           count: 1,
//           sum: productData.price,
//           totalPrice: productData.price,
//         };

//         const cartData = await Cart.findOne({ userName: userId, "products.productId": productId });

//         if (cartData) {
//           // Product is already in the cart, increase quantity
//           const newCart = await Cart.findOneAndUpdate(
//             { userid: userId },
//             { $set: { userid: userId, userName: req.session.name }, $push: { products: cartItem } },
//             { upsert: true, new: true }
//           );

//           console.log("Product added to the cart");
//           res.json({ result: true });
//         } else {
//           // Product not in the cart, add to cart
//           const newCart = await Cart.findOneAndUpdate(
//             { userid: userId },
//             { $set: { userid: userId, userName: req.session.name }, $push: { products: cartItem } },
//             { upsert: true, new: true }
//           );

//           console.log("Product added to the cart");
//           res.json({ result: true });
//         }
//       } else {
//         // Handle the case when the product is out of stock
//         res.json({ result: "out_of_stock" });
//       }
//     } else {
//       console.log("Invalid request parameters");
//       res.status(400).send("Bad Request");
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };


let add=async(req,res)=>{
  try{
    const userId = req.session.user_id;
    const productId = req.query.id;
    // console.log(productId);
    const productData = await ProductDB.findOne({ _id: productId });
    if(productData){
      const cartItem = {
        productId: productId,
        count: 1,
        sum: productData.price,
        totalPrice: productData.price,
      };
       
        const newCart = await Cart.findOneAndUpdate(
          { userid: userId },
          { $set: { userid: userId }, $push: { products: cartItem } },
          { upsert: true, new: true }
        );
        
        console.log("Product added to the cart");
        
          
        // const newCart = await Cart.findOneAndUpdate(
        //   { userid: userId },
        //   { $set: { userid: userId }, $push: { products: cartItem } },
        //   { upsert: true, new: true });
    
    }
  }catch(error){
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  
  }
}


let updateQuantity=async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const productId = req.query.id;
        const newCart = await Cart.findOneAndUpdate(
          { userid: userId, "products.productId": productId },
          { $set: { "products.$.count": req.body.count } },
          
        )
        res.redirect('/cart');
    }catch(error){
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

let deleteCart = async (req, res) => {
    try {
        console.log('Reached deleteCart route');
        const userId = req.session.user_id;
        const productId = req.query.id;
        
        //find the product in the cart
        const product = await Cart.findOne({ userid: userId, "products.productId": productId });
        if(product){
            //delet the product and return the updated cart
            const updatedCart = await Cart.updateOne(
                { userid: userId },
                {$pull: { products: { productId: productId } }}
            )
            
        }
        res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

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


// +++++++++++++++++++++++++++++ADD QUANTITY TO CART+++++++++++++++++++++++++++++++++



// +++++++++++++++++++++++++++++DELETE PRODUCT FROM CART+++++++++++++++++++++++++++++++++

  
module.exports = {
  
    add, 
    renderCart,
    buyNow,
    deleteCart,
    updateQuantity
}