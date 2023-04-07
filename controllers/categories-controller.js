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
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    var sql = 'SELECT * FROM categories';
    let query = conn.query(sql, function(err, results) {
        if(err) throw err;
        res.render('categories/categories-view',{
            title: 'CATEGORIES',
            cookie,
            categories: results
        });
    });
};

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
exports.getCategories = getCategories;
exports.getCategoryById = getCategoryById;
exports.addCategories = addCategories;
exports.updateCategories = updateCategories;
exports.deleteCategories = deleteCategories;