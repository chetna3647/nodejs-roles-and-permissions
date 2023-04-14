const cookieParser = require('cookie-parser');
const { cookie } = require('express-validator');
const conn = require('../dbConnection');
const multer = require('multer');

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

//retrieve category
const getCategories = (req, res) => {
    var cookie = '';
    var role = '3';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
        role = req.cookies.role;
    }
    if(Object.keys(req.query).length == 0 || req.query.search == ''){
        var sql = 'SELECT * FROM categories';
        let query = conn.query(sql, function(err, results) {
            if(err) throw err;
            res.render('categories/categories-view',{
                title: 'CATEGORIES',
                cookie,
                role,
                categories: results
            });
        });
    } else {
        const search_key = req.query.search;
        var sql = `SELECT * FROM categories WHERE cat_name LIKE '%${search_key}%' OR id LIKE '%${search_key}%'`;
        conn.query(sql, function(err, result){
            if(err) throw err;
            res.render('categories/categories-view',{
                title: 'CATEGORIES',
                cookie,
                role,
                categories: result
            });
        });
    }
};

//retrieve products by categroy
const getProductsByCategory = (req, res) => {
    var cookie = '';
    var role = '3';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
        role = req.cookies.role;
    }
    var sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt,
    products.product_sku, products.collection_name, products.gross_wt, products.product_color, 
    products.product_purity, products.product_mat_charge, products.huid_charges, 
    products.certificate_charges, products.total_charges FROM products LEFT JOIN 
    categories ON products.cat_id = categories.id WHERE products.cat_id = '${req.params.id}'`;
    let query = conn.query(sql, function (err, results) {
        if (err) throw err;
        if (results.length > 0) {
            var totalProduct = [];
            var productData = {};
            results.forEach(result => {
                var product_sql = `SELECT * FROM product_images WHERE product_id = '${result.product_id}'`;
                conn.query(product_sql, async function (err, images) {
                    if (err) throw err;
                    productData = {
                        product_id: result.product_id,
                        product_images: [],
                        cat_name: result.cat_name,
                        product_name: result.product_name,
                        product_wt: result.product_wt,
                        product_sku: result.product_sku,
                        collection_name: result.collection_name,
                        gross_wt: result.gross_wt,
                        product_color: result.product_color,
                        product_purity: result.product_purity,
                        product_mat_charge: result.product_mat_charge,
                        huid_charges: result.huid_charges,
                        certificate_charges: result.certificate_charges,
                        total_charges: result.total_charges
                    }
                    images.forEach(image => {
                        if (productData.product_id == image.product_id) {
                            productData.product_images.push({
                                product_image: image.product_image
                            })
                        }
                    });
                    totalProduct.push(productData);
                });
            });
            setTimeout(() => {
                res.render('products/products-by-category', {
                    title: 'PRODUCT',
                    cookie,
                    role,
                    totalProduct
                });
            }, 1000);
        } else {
            res.render('products/products-by-category', {
                    title: 'PRODUCT',
                    cookie,
                    role,
                    totalProduct: []
                });
        }
    });
}

const searchCategory = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const search_key = req.params.key;
    var sql = `SELECT * FROM categories WHERE cat_name = '${search_key}'`;
    conn.query(sql, function(err, result){
        if(err) throw err;
        res.render('categories/categories-view',{
            title: 'CATEGORIES',
            cookie,
            categories: result
        });
    });
}

//retrieve category by id
const getCategoryById = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    id = req.params.id;
    var sql = `SELECT * FROM categories WHERE id = '${id}'`;
    let query = conn.query(sql, function(err, results) {
        if(err) throw err;
        if(results.length > 0) {
            res.render('categories/single-category',{
                title: 'CATEGORIES',
                cookie,
                categories: results
            });
        } else {
            res.send("Id doest not exist");
        }
    });
};

//add category
const addCategoryRoute = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    res.render('categories/add-category-view',{
        title: 'ADD CATEGORY',
        cookie
    });
};

const addCategories = (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const files = req.file;
    const cat_name = body.cat_name;
    // const { cat_image, cat_name} = req.body;
    conn.query('SELECT cat_name FROM categories WHERE cat_name = ?', [cat_name], async (error, result) => {
        if(error) {
            console.log(error);
        }
        if(result) {
            if (!files) {
                return res.status(400).send({ message: 'Please upload a file.' });
            }
            var sql = "INSERT INTO categories (cat_image, cat_name) VALUES ('" + files.originalname + "', '"+cat_name+"')";
            var query = conn.query(sql, function(err, result) {
                if(err) throw err;
                console.log("Category added");
            });
            res.redirect('/categories');
        } else {
            return res.send('That category is already exist');
        }
    });
};

//update category
const getEditCategory = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }

    let id = req.params.id;
    let sql = `SELECT * FROM categories WHERE id = '${id}'`;
    let query = conn.query(sql, (err, result) => {
        if(err) throw err;
        // res.send({user: result[0]});
        res.render('categories/update-category-view',{
            title: 'UPDATE CATEGORY',
            cookie,
            category: result[0]
        });
    });
};

const updateCategories = (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const id = body.id;
    const cat_name = body.cat_name;
    var sql = `SELECT * FROM categories WHERE id = '${id}'`;
    conn.query(sql, function(err, results) {
        if(err) throw err;
        if(results.length > 0) {
            let updatesql = `UPDATE categories SET cat_image = '${req.file.originalname}', cat_name = '${cat_name}' WHERE id = ${id}`;
            let query = conn.query(updatesql, (err, result) => {
                if(err) throw err;
                console.log("Data updated!");
                res.redirect('/categories');
            });
        } else {
            res.send("Id doest not exist");
        }
    });
};

//delete category
const deleteCategories = (req, res) => {
    let id = req.params.id;

    conn.query('SELECT * FROM categories WHERE id = ?', [id], async (error, result) => {
        if(error) {
            console.log(error);
        }

        if(result.length > 0) {
            let sql = `DELETE FROM categories WHERE id = ${id}`;
            let query = conn.query(sql, (err, result) => {
                if(err) throw err;
                console.log('Category deleted');
                res.redirect('/categories');
            });
        } else {
            res.send('Id does not exist');
        }
    });
};


//pages routing
exports.addCategoryRoute = addCategoryRoute;
exports.getEditCategory = getEditCategory;

//apis
exports.getProductsByCategory = getProductsByCategory;
exports.searchCategory = searchCategory;
exports.getCategories = getCategories;
exports.getCategoryById = getCategoryById;
exports.addCategories = addCategories;
exports.updateCategories = updateCategories;
exports.deleteCategories = deleteCategories;