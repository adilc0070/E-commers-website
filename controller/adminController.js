let adminModel = require("../models/adminModel");
let user = require("../models/userModel");
let ProductDB = require("../models/productModel");
let category = require("../models/catogoryModel");
let productController = require("../controller/productController");
let multer = require("../middleware/multer");
let bcrypt = require("bcrypt");
let env = require("dotenv");
env.config();
let session = require("express-session");
const Order = require("../models/orederModel");
let pdf = require('html-pdf')
let ejs = require('ejs')
let path = require('path')
const ExcelJS = require('exceljs');
const zip = require('express-zip');

//--------------------email validation function---------------------
function validateEmail(email) {
    const regex = /^[^\s@]+@(gmail\.com|icloud\.com|yahoo\.com)$/;
    return regex.test(email);
}

//password validation
function validatePassword(password) {
    // Password should be at least 8 characters long and contain both letters and numbers
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

//admin login page
let adminLogin = async (req, res) => {
    try {
        res.render("adminLogIn");
    } catch (error) {
        console.log(error.message);
    }
};

//admin logni page rendrering
let adminLogon = async (req, res) => {
    try {
        let { adminEmail, adminPassword } = req.body;
        let admi = await adminModel.findOne({ email: adminEmail });
        let emailErrorMessage;
        let passwordErrorMessage;

        if (!adminEmail || !adminPassword) {
            emailErrorMessage = "Please Enter Email and Password";
            res.render("adminLogIn", { emailErrorMessage, passwordErrorMessage });
        } else if (!validateEmail(adminEmail)) {
            emailErrorMessage = "Please Enter Valid Email";
            res.render("adminLogIn", { emailErrorMessage, passwordErrorMessage });
        } else if (admi == null) {
            emailErrorMessage = "Sorry Admin not Found";
            res.render("adminLogIn", { emailErrorMessage, passwordErrorMessage });
        } else {
            let isMatch = await bcrypt.compare(adminPassword, admi.password);

            if (isMatch != false) {
                req.session.admin_id = admi._id;
                res.redirect("/admin/dashboard");
            } else {
                passwordErrorMessage = "Wrong Password";
                res.render("adminLogIn", { emailErrorMessage, passwordErrorMessage });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};
let adminRender = async (req, res) => {
    try {
        let orders = await Order.find()
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let pendingOrders = await Order.find({ status: { $ne: "delivered" } })
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let deliveredOrders = await Order.find({ status: "delivered" })
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let usersCount = await user.count();
        let purchasersCount = await Order.distinct("userId");
        let codOrders= await Order.find({paymentType:"cod"})
        let cod
        if(codOrders.length != 0){
            cod = await Order.aggregate([
                {
                    $match: {
                        paymentType: "cod",
                        status: "delivered",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                    },
                },
            ]);
            if(cod.length != 0){
                cod = cod[0].total
            }else{
                cod = 0
            }
        }
        let onlineOrders= await Order.find({paymentType:"paypal"})
        let online
        if(onlineOrders.length != 0){
            online = await Order.aggregate([
                {
                    $match: {
                        paymentType: "paypal",
                        status: "delivered",
                    },
    
                }, {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                    },
                }
            ])
            if(online.length != 0){
                online = online[0].total
            }else{
                online = 0
            }
        }
        let revenue = 0;
        let sales = 0;
        let purchases = 0;
        let pendingRevenue = 0;
        let pendingSales = 0;
        deliveredOrders.forEach((order) => {
            order.products.forEach((product) => {
                revenue += product.productId.price * product.quantity;
                purchases += product.quantity;
            });
            sales += 1;
        });
        pendingOrders.forEach((order) => {
            order.products.forEach((product) => {
                pendingRevenue += product.productId.price * product.quantity;
                purchases += product.quantity;
            });
            pendingSales += 1;
        });
        let averagePendingRevenue = pendingRevenue / pendingSales || 0;
        let letestSales = await Order.find({ status: "delivered" })
            .sort({ date: -1 })
            .populate("products.productId")
            .populate({ path: "userId", select: "name" }).limit(4);
        letestSales.forEach((order) => {
            order.products.forEach((product) => {

            });
        });
        let deliveredOrdersCount = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                },
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    _id: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                }
            }
        ])
        let returnedOrdersCount = await Order.aggregate([
            {
                $match: {
                    status: "rejected",
                },
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    _id: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                }
            }

        ])
        let pendingOrdersCount = await Order.aggregate([
            {
                $match: {
                    status: { $ne: { $in: ["delivered", "rejected"] } }
                },
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    _id: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                }
            }
        ])
        // manage varables 
        let dele = new Array(5).fill(0)
        let ret = new Array(5).fill(0)
        let pend = new Array(5).fill(0)
        for (i = 0; i < deliveredOrdersCount.length; i++) {
            dele[i] = deliveredOrdersCount[i].count
        }
        for (i = 0; i < returnedOrdersCount.length; i++) {
            ret[i] = returnedOrdersCount[i].count
        }
        for (i = 0; i < pendingOrdersCount.length; i++) {
            pend[i] = pendingOrdersCount[i].count
        }
        res.render("dashboard", {
            orders,
            revenue,
            sales,
            usersCount,
            purchasersCount: purchasersCount.length,
            deliveredOrders,
            pendingOrders,
            averagePendingRevenue,
            pendingRevenue,
            pendingSales,
            letestSales,
            cod,
            online,
            dele, ret, pend
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};
const chartFilterWeek = async (req, res) => {
    try {
        const totalCodWeek = await Order.countDocuments({
            status: 'delivered',
            paymentType: 'cod',
            date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const totalOnlineWeek = await Order.countDocuments({
            status: 'delivered',
            paymentType: 'paypal',
            date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        res.json([totalCodWeek, totalOnlineWeek, 0]);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
const chartFilterMonth = async (req, res) => {
    try {
        const totalCodMonth = await Order.countDocuments({
            status: 'delivered',
            paymentType: 'cod',
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        const totalOnlineMonth = await Order.countDocuments({
            status: 'delivered',
            paymentType: 'paypal',
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        res.json([totalCodMonth, totalOnlineMonth, 0]);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
const chartFilterYear = async (req, res) => {
    try {
        const totalCodYear = await Order.countDocuments({
            status: 'delivered',
            paymentType: 'cod',
            date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        });

        const totalOnlineYear = await Order.countDocuments({
            status: 'delivered',
            paymentType: 'paypal',
            date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        });

        res.json([totalCodYear, totalOnlineYear, 0]);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
let ordersDashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 8;
        let allOrders = await Order.find().countDocuments();
        const totalPages = Math.ceil(allOrders / pageSize);
        let orders = await Order.find()
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let pendingOrders = await Order.find({ status: { $ne: "delivered" } })
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let deliveredOrders = await Order.find({ status: "delivered" })
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let usersCount = await user.count();
        let purchasersCount = await Order.distinct("userId");
        let revenue = 0;
        let sales = 0;
        let purchases = 0;
        let pendingRevenue = 0;
        let pendingSales = 0;
        deliveredOrders.forEach((order) => {
            order.products.forEach((product) => {
                revenue += product.productId.price * product.quantity;
                purchases += product.quantity;
            });
            sales += 1;
        });
        pendingOrders.forEach((order) => {
            order.products.forEach((product) => {
                pendingRevenue += product.productId.price * product.quantity;
                purchases += product.quantity;
            });
            pendingSales += 1;
        });
        let averagePendingRevenue = pendingRevenue / pendingSales || 0;
        res.render("orders", {
            orders,
            revenue,
            sales,
            usersCount,
            purchasersCount: purchasersCount.length,
            deliveredOrders,
            pendingOrders,
            averagePendingRevenue,
            pendingRevenue,
            pendingSales,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};
let salesDashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 8;
        let allOrders = await Order.find().countDocuments();
        const totalPages = Math.ceil(allOrders / pageSize);
        let orders = await Order.find()
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let pendingOrders = await Order.find({ status: { $ne: "delivered" } })
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let deliveredOrders = await Order.find({ status: "delivered" })
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("products.productId")
            .populate({ path: "userId", select: "name" });
        let usersCount = await user.count();
        let purchasersCount = await Order.distinct("userId");
        let revenue = 0;
        let sales = 0;
        let purchases = 0;
        let pendingRevenue = 0;
        let pendingSales = 0;
        deliveredOrders.forEach((order) => {
            order.products.forEach((product) => {
                revenue += product.productId.price * product.quantity;
                purchases += product.quantity;
            });
            sales += 1;
        });
        // calculate pending revenue
        pendingOrders.forEach((order) => {
            order.products.forEach((product) => {
                pendingRevenue += product.productId.price * product.quantity;
                purchases += product.quantity;
            });
            pendingSales += 1;
        });
        let averagePendingRevenue = pendingRevenue / pendingSales || 0;
        res.render("new", {
            orders,
            revenue,
            sales,
            usersCount,
            purchasersCount: purchasersCount.length,
            deliveredOrders,
            pendingOrders,
            averagePendingRevenue,
            pendingRevenue,
            pendingSales,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
};

let userManagement = async (req, res) => {
    try {
        res.render("userManagement", {
            users: await user.find(),
        });
    } catch (error) {
        console.log(error.message);
    }
};

let blockuser = async (req, res) => {
    try {
        let id = req.query.id;
        let User = await user.updateOne({ _id: id }, { $set: { is_block: 1 } });
        res.redirect("/admin/userManagement");
    } catch (error) {
        console.log(error.message);
    }
};

let unblockuser = async (req, res) => {
    try {
        let id = req.query.id;
        let User = await user.updateOne({ _id: id }, { $set: { is_block: 0 } });
        res.redirect("/admin/userManagement");
    } catch (error) {
        console.log(error.message);
    }
};
let logOut = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/admin/login");
    } catch (error) {
        console.log(error.message);
    }
};

let addCategory = async (req, res) => {
    try {
        let categoryErrorMessage;
        let { categoryName } = req.body;
        let existingCategory = await category.findOne({
            name: { $regex: new RegExp(categoryName, "i") },
        });
        if (!existingCategory) {
            let newCategory = new category({ name: categoryName });
            await newCategory.save();
            res.redirect("/admin/categoryManagement");
        } else {
            categoryErrorMessage = "Category Already Exists";
            res.render("addCategory", { categoryErrorMessage });
        }
    } catch (error) {
        console.log(error.message);
    }
};

let categoryManagement = async (req, res) => {
    try {
        let cats = await category.find();
        res.render("categoryManagement", { categories: cats });
    } catch (error) {
        console.log(error.message);
    }
};

let editCategory = async (req, res) => {
    try {
        let Id = req.query.id;
        let categories = await category.findOne({ _id: Id });
        // console.log(categories);
        res.render("editCategory", { categories });
    } catch (error) {
        console.log(error.message);
    }
};
let editedCategory = async (req, res) => {
    try {
        let Id = req.query.id;
        let { categoryName } = req.body;
        let editCatErrorMessage;
        let exxist = await category.findOne({ name: categoryName });
        let categories = await category.findOne({ _id: Id });
        if (exxist) {
            editCatErrorMessage = "Category Already Exist";
            res.render("editCategory", { editCatErrorMessage, categories });
        } else if (categoryName == "") {
            editCatErrorMessage = "Please Enter Category Name";
            res.render("editCategory", { editCatErrorMessage, categories });
        } else {
            let cat = await category.updateOne(
                { _id: Id },
                { $set: { name: categoryName } }
            );
            res.redirect("/admin/categoryManagement");
        }
    } catch (error) {
        console.log(error.message);
    }
};

let addCatRender = async (req, res) => {
    try {
        res.render("addCategory");
    } catch (error) {
        console.log(error.message);
    }
};

let blockCategory = async (req, res) => {
    try {
        let Id = req.query.id;
        let cat = await category.updateOne({ _id: Id }, { $set: { blocked: 1 } });
        res.redirect("/admin/categoryManagement");
    } catch (error) {
        console.log(error.message);
    }
};

let unblockCategory = async (req, res) => {
    try {
        let Id = req.query.id;
        let cat = await category.updateOne({ _id: Id }, { $set: { blocked: 0 } });
        res.redirect("/admin/categoryManagement");
    } catch (error) {
        console.log(error.message);
    }
};

//products management page
let productManagement = async (req, res) => {
    try {
        let products = await ProductDB.find();
        let query = {};
        if (req.query.search) {
            query = { product_name: { $regex: new RegExp(req.query.search, 'i') } };
        }

        res.render("productManagement", { products });
    } catch (error) {
        console.log(error.message);
    }
};

//==========addprodect page rendring

let productAdd = async (req, res) => {
    try {
        let categories = await category.find();
        let errors = ''
        res.render("addProduct", { categories, errors });
    } catch (error) {
        console.log(error.message);
    }
};

//===========productadding
const addProduct = async (req, res) => {
    try {
        let errors = ''
        let details = req.body;
        const files = await req.files;
        if (details.stock > 0 || details.price > 0) {
            let product = new ProductDB({
                product_name: details.product_name,
                price: details.price,
                category: details.category,
                description: details.description,
                stock: details.stock,
                "images.image1": files.image1[0].filename,
                "images.image2": files.image2[0].filename,
                "images.image3": files.image3[0].filename,
                "images.image4": files.image4[0].filename,
            });

            let result = await product.save();
            res.redirect("/admin/productManagement");
        } else {
            errors = 'Please Enter Valid Stock and Price'
            let categories = await category.find();
            res.render("addProduct", { errors, categories })
        }
    } catch (error) {
        console.log(error.message);
    }
};

// This Function used to Update Product , includuing Image Managment..
const updateProduct = async (req, res) => {
    try {
        let errors = ''
        let categories = await category.find();
        let Id = req.query.id;
        let products = await ProductDB.findOne({ _id: Id });
        let details = req.body;
        let imagesFiles = req.files;
        let currentData = await ProductDB.findOne({ _id: req.query.id });

        let img1, img2, img3, img4;

        img1 = imagesFiles.image1
            ? imagesFiles.image1.filename
            : currentData.images.image1;
        img2 = imagesFiles.image2
            ? imagesFiles.image2[0].filename
            : currentData.images.image2;
        img3 = imagesFiles.image3
            ? imagesFiles.image3[0].filename
            : currentData.images.image3;
        img4 = imagesFiles.image4
            ? imagesFiles.image4[0].filename
            : currentData.images.image4;

        if (details.stock > 0 && details.price > 0) {
            let update = await ProductDB.updateOne(
                { _id: req.query.id },
                {
                    $set: {
                        product_name: details.product_name,
                        price: details.price,
                        frame_shape: details.frame_shape,
                        gender: details.gender,
                        description: details.description,
                        stock: details.stock,
                        "images.image1": img1,
                        "images.image2": img2,
                        "images.image3": img3,
                        "images.image4": img4,
                    },
                }
            );
            res.redirect("/admin/productManagement");
        } else {
            errors = 'Please Enter Valid Stock and Price'
            res.render("editProduct", { categories, products, errors });

        }
    } catch (error) {
        console.log(error.message);
    }
};

//===============get the project editng page
let updateProductPage = async (req, res) => {
    try {
        let errors = ''
        let categories = await category.find();
        let Id = req.query.id;
        let products = await ProductDB.findOne({ _id: Id });
        res.render("editProduct", { categories, products, errors });
    } catch (error) {
        console.log(error.message);
    }
};

// ==========product blocking and unblocking
let blockProduct = async (req, res) => {
    try {
        let product = await ProductDB.findOne({ _id: req.query.id });
        if (product.block == 0) {
            let cat = await ProductDB.updateOne(
                { _id: req.query.id },
                { $set: { block: 1 } }
            );
            res.redirect("/admin/productManagement");
        } else {
            await ProductDB.updateOne({ _id: req.query.id }, { $set: { block: 0 } });
            res.redirect("/admin/productManagement");
        }
    } catch (error) {
        console.log(error.message);
    }
};


const SalesReport = async (req, res) => {
    try {
        const orderdata = await Order.find({})
        ejs.renderFile(
            path.join(__dirname, "../views/admin/", "report-template.ejs"),
            {
                orderdata,
            },
            (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        height: "11.25in",
                        width: "8.5in",
                        header: {
                            height: "20mm",
                        },
                        footer: {
                            height: "20mm",
                        },
                    };
                    pdf.create(data, options).toFile("report.pdf", function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            const pdfpath = path.join(__dirname, "../report.pdf");
                            res.sendFile(pdfpath);
                        }
                    });
                }
            }
        );

    } catch (error) {
        console.log(error.message);
    }
}
let report = async (req, res) => {
    try {
        let orderdata = await Order.find({}).sort({ date: -1 }).populate('products.productId').populate({ path: 'userId', select: 'name' });
        let totalSales = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                },
            },
        ]);
        totalSales = totalSales[0].total
        let button = req.query.button

        if (button == "lastWeek") {
            orderdata = await Order.find({ date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }).sort({ date: -1 }).populate('products.productId').populate({ path: 'userId', select: 'name' });
            totalSales = await Order.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        },
                        status: "delivered",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                    },
                },
            ]);
            if(totalSales == 0){
                totalSales = 0
            }else{
                totalSales = totalSales[0].total
            }
            res.render('salesReport', { orderdata, totalSales })

        } else if (button == "lastMonth") {
            orderdata = await Order.find({ date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }).sort({ date: -1 }).populate('products.productId').populate({ path: 'userId', select: 'name' });
            totalSales = await Order.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                        status: "delivered",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                    },
                },
            ]);
            totalSales = totalSales[0].total
            res.render('salesReport', { orderdata, totalSales })

        } else if (button == "lastYear") {
            orderdata = await Order.find({ date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } }).sort({ date: -1 }).populate('products.productId').populate({ path: 'userId', select: 'name' });
            totalSales = await Order.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                        },
                        status: "delivered",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                    },
                },
            ]);
            totalSales = totalSales[0].total
            res.render('salesReport', { orderdata, totalSales })
        } else if (button == "custom") {
            let startDate = new Date(req.query.fromDate)
            let endDate = new Date(req.query.toDate)
            orderdata = await Order.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: -1 }).populate('products.productId').populate({ path: 'userId', select: 'name' });
            totalSales = await Order.aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate,
                            $lte: endDate
                        },
                        status: "delivered",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                    },
                }
            ])
            if (orderdata.length == 0) {
                totalSales = 0
            } else {
                totalSales = totalSales[0].total
            }
            console.log("ejsrender");
            ejs.renderFile(
                
                path.join(__dirname, "../views/admin/", "salesReport.ejs"),
                {
                    orderdata,
                    totalSales
                },
                async (err, data) => {
                    if (err) {
                        console.log("err");
                        res.send(err);
                    } else {
                        console.log("else");

                        let options = {
                            height: "11.25in",
                            width: "8.5in",
                            header: {
                                height: "0mm",
                            },
                            footer: {
                                height: "0mm",
                            },
                        };
                        let pdfPromise=new Promise((resolve,reject)=>{
                            pdf.create(data, options).toFile("report.pdf", function (err, pdfPath) {
                                if (err) {
                                    resolve("Error generating PDF");
                                } else {
                                    resolve(pdfPath.filename)
                                }
                            });
                        })
                        // Generate Excel
                        const excelOptions = {
                            filename: 'report.xlsx',
                            useStyles: true,
                            useSharedStrings: true,
                        };
                
                        const excelPromise = new Promise((resolve, reject) => {
                            const workbook = new ExcelJS.Workbook();
                            const worksheet = workbook.addWorksheet('Sales Report');
                
                            // Add headers

                            worksheet.addRow([
                                'Date',
                                'Product Name',
                                'Quantity',
                                'Price',
                                'Total',
                                'Payment Method',
                            ]);
                            orderdata.forEach((order) => {
                                order.products.forEach((product) => {
                                    worksheet.addRow([
                                        order.date.toLocaleString('en-US'),
                                        product.productId.product_name,
                                        product.quantity,
                                        `${product.productId.price.toFixed(2)}`, // Add backticks around the template string
                                        `${(product.quantity * product.productId.price).toFixed(2)}`, // Add backticks around the template string
                                        order.paymentType
                                    ]);
                                });
                            })
                
                            workbook.xlsx.writeFile(excelOptions.filename).then(() => {
                            resolve(excelOptions.filename);
                            }).catch((err) => {
                            console.log(err);
                            reject('Error generating Excel');
                            });
                        });
                        try {
                            const [pdfPath, excelPath] = await Promise.all([pdfPromise, excelPromise]);
                            
                            
                            res.json({ pdfPath, excelPath });
                            console.log("zip");

                          } catch (error) {
                            console.log(error);
                            res.render('500')
                          }

                    }
                }
            )
        } else {
            res.render('salesReport', { orderdata, totalSales })
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }

}

const download = async (req, res) => {
    try {
    
      const pdfPath =  path.join(__dirname, "../report.pdf")
      const excelPath = path.join(__dirname, "../report.xlsx")
        res.zip([
            { path: pdfPath , name: 'sales_report.pdf' },
            { path: excelPath, name: 'sales_report.xlsx' },
          ]);
    } catch (error) {
        console.log(error.message);
        res.status(500).send(error.message);
    }
}




module.exports = {
    adminLogin,
    adminLogon,
    adminRender,
    ordersDashboard,
    userManagement,
    blockuser,
    unblockuser,
    logOut,
    categoryManagement,
    addCatRender,
    addCategory,
    editCategory,
    editedCategory,
    blockCategory,
    unblockCategory,
    productManagement,
    addProduct,
    updateProduct,
    productAdd,
    updateProductPage,
    blockProduct,
    report,
    chartFilterWeek,
    chartFilterMonth,
    chartFilterYear,
    salesDashboard,
    download,
};
