const express = require('express');
const productController = require('../controllers/product-controller');
const checkAuth = require('../middleware/check-auth');
const permissions = require('../middleware/permissions/permissions');

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductsById);

router.use(checkAuth);

//add product route
router.get('/product/add-category', permissions.createPermissions, productController.addProductRoute);
router.post('/product/add-product', productController.addProducts);

//update product route
router.get('/edit-product/:id', permissions.updatePermissions, productController.updateProductRoute);
router.post('/product/update-product', productController.updateProduct);

//delete produt route
router.get('/delete-product/:id', permissions.deletePermissions, productController.deleteProduct);

module.exports = router;