const multer = require('multer');
const path = require('path');

// const productImageStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, path.join(__dirname, '../public/products/images'));
//     },
//     filename: function (req, file, cb) {
//       cb(
//         null,
//         file.fieldname + '-' + Date.now() + path.extname(file.originalname)
//       );
//     },
//   });
  
//   const productImagesUpload = multer({
//     storage: productImageStorage,
//   }).array('images', 4); // 'images' is the field name, and 4 is the maximum number of files

// product uploads
var storageProduct = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname,"../public/products/images"));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

var storageAvatar = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname,"../public/Profile/images"));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const uploadProduct = multer({ storage: storageProduct });
const productImagesUpload = uploadProduct.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 },{ name: 'image3', maxCount: 1 },{ name: 'image4', maxCount: 1 }])
  
const uploadProfile = multer({
  storage: storageAvatar,
 
});
const profileImagesUpload=uploadProfile.single('image')

  module.exports = { 
    productImagesUpload,
    profileImagesUpload
  };
  