const express = require('express');
const productController = require('../controllers/product-controller');
const checkAuth = require('../middleware/check-auth');
const permissions = require('../middleware/permissions/permissions');
const multer  = require('multer');

//Configuration for Multer
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, file.originalname);
    },
});

//Calling the "multer" Function
const upload = multer({ storage: multerStorage });

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductsById);
router.get('/product/add-to-cart/:id', productController.addToCart);

router.use(checkAuth);

//add product route
router.get('/product/add-category', permissions.createPermissions, productController.addProductRoute);
router.post('/product/add-product', upload.array("product_image", 10), productController.addProducts);

//update product route
router.get('/edit-product/:id', permissions.updatePermissions, productController.updateProductRoute);
router.post('/product/update-product', upload.array("product_image", 10), productController.updateProduct);

//delete produt route
router.get('/delete-product/:id', permissions.deletePermissions, productController.deleteProduct);

module.exports = router;