const express = require('express');
const categoriesController = require('../controllers/categories-controller');
const categoryValidation = require('../validations/categories-validation');
const checkAuth = require('../middleware/check-auth');
const permissions = require('../middleware/permissions/permissions');
const imageUpload = require('../middleware/image-upload');

const router = express.Router();

//get categories
router.get('/', permissions.readPermissions, categoriesController.getCategories);
router.get('/:id', categoriesController.getCategoryById);

router.use(checkAuth);

//add category routings
router.get('/category/add-category', permissions.createPermissions, categoriesController.addCategoryRoute);
router.post('/category/save-category', categoriesController.addCategories);

//edit category
router.get('/edit-category/:id', permissions.updatePermissions, categoriesController.getEditCategory);
router.post('/category/update-category', categoriesController.updateCategories);

//delete
router.get('/delete-category/:id', permissions.deletePermissions, categoriesController.deleteCategories);

module.exports = router;