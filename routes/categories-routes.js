const express = require('express');
const categoriesController = require('../controllers/categories-controller');
const categoryValidation = require('../validations/categories-validation');
const checkAuth = require('../middleware/check-auth');
const permissions = require('../middleware/permissions/permissions');
const imageUpload = require('../middleware/image-upload');
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

//get categories
router.get('/', categoriesController.getCategories);
router.get('/:id', categoriesController.getCategoryById);

// router.get('/', permissions.readPermissions, categoriesController.searchCategory);
// router.post('/search', permissions.readPermissions, categoriesController.searchCategorypost);

router.get('/products/:id', categoriesController.getProductsByCategory);

router.use(checkAuth);

//add category routings
router.get('/category/add-category', permissions.createPermissions, categoriesController.addCategoryRoute);
router.post('/category/save-category', upload.single("cat_image"), categoriesController.addCategories);

//edit category
router.get('/edit-category/:id', permissions.updatePermissions, categoriesController.getEditCategory);
router.post('/category/update-category', upload.single("category_image"), categoriesController.updateCategories);

//delete
router.get('/delete-category/:id', permissions.deletePermissions, categoriesController.deleteCategories);

module.exports = router;