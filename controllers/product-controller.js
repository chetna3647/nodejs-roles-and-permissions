const conn = require('../dbConnection');

//retrieve product
const getProducts = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    var sql = 'SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt, products.product_sku, products.collection_name, products.gross_wt, products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON products.cat_id = categories.id';
    let query = conn.query(sql, function(err, results) {
        if(err) throw err;
        res.render('products/products-view',{
            title: 'Products',
            cookie,
            products: results
        });
    });
};

//retrieve product by id
const getProductsById = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    id = req.params.id;
    var sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt, products.product_sku, products.collection_name, products.gross_wt, products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON products.cat_id = categories.id WHERE products.product_id = ${id}`;
    let query = conn.query(sql, function(err, results) {
        if(err) throw err;
        if(results.length > 0) {
            res.render('products/single-product',{
                title: 'PRODUCT',
                cookie,
                products: results
            });
        } else {
            res.send("Id doest not exist");
        }
    });
};

//add product
const addProductRoute = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    var sql = 'SELECT cat_name FROM categories';
    conn.query(sql, function(err, results) {
        if(err) throw err;
        var cat_names = results;
        res.render('products/add-product-view',{
            title: 'ADD PRODUCT',
            cookie,
            cat_names
        });
    });
}

const addProducts = (req, res) => {
    const cat_name = req.body.cat_name;
    const sql = `SELECT id FROM categories WHERE cat_name = '${cat_name}'`;
    conn.query(sql, function(err, results) {
        if(err) throw err;
        var cat_id = results[0].id;
        const { product_wt, product_name, product_sku, collection_name, gross_wt, product_color, product_purity, product_mat_charge, huid_charges, certificate_charges, total_charges } = req.body;
        conn.query('SELECT product_name FROM products WHERE product_name = ?', [product_name], async (error, result) => {
            if(error) {
                console.log(error);
            }

            if(result.length > 0) {
                return res.send('That product is already exist');
            } else {
                const productData = { cat_id: cat_id, product_wt: product_wt, product_name: product_name, product_sku: product_sku, collection_name: collection_name, gross_wt: gross_wt, product_color: product_color, product_purity: product_purity,product_mat_charge: product_mat_charge, huid_charges: huid_charges, certificate_charges: certificate_charges, total_charges: total_charges };
                const sql = 'INSERT INTO products SET ?'
                conn.query(sql, productData, (error, results) => {
                    if(error) {
                        console.log(error);
                    } else {
                        console.log("Data inserted!");
                        res.redirect('/products');
                    }
                });
            }
        });
    });
};

//update product
const updateProductRoute = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    let product_id = req.params.id;
    let sql_cat_name = 'SELECT cat_name FROM categories';
    conn.query(sql_cat_name, function(err, results) {
        if(err) throw err;
        var cat_names = results;
        let sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt, products.product_sku, products.collection_name, products.gross_wt, products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON products.cat_id = categories.id WHERE product_id = ${product_id}`;
        let query = conn.query(sql, (err, results) => {
            if(err) throw err;
            res.render('products/update-product-view',{
                title: 'UPDATE PRODUCT',
                cookie,
                cat_names,
                product: results[0]
            });
        });
    })
}

const updateProduct = (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const cat_name = body.cat_name;
    const product_id = body.product_id;
    var sql = `SELECT id FROM categories WHERE cat_name = '${cat_name}'`;
    conn.query(sql, function(err, results) {
        if(err) throw err;
        var cat_id = results[0].id;
        var sql = `SELECT * FROM products WHERE product_id = ${product_id}`;
        const { product_wt, product_name, product_sku, collection_name, gross_wt, product_color, product_purity, product_mat_charge, huid_charges, certificate_charges, total_charges } = body;
        conn.query(sql, function(err, results) {
            if(err) throw err;
            if(results.length > 0) {
                let updatesql = `UPDATE products SET cat_id = '${cat_id}', product_wt = '${product_wt}', 
                product_name = '${product_name}', product_sku = '${product_sku}', 
                collection_name = '${collection_name}', gross_wt = '${gross_wt}', 
                product_color = '${product_color}', product_purity = '${product_purity}', 
                product_mat_charge = '${product_mat_charge}', huid_charges = '${huid_charges}', 
                certificate_charges = '${certificate_charges}', total_charges = '${total_charges}' WHERE product_id = ${product_id}`;
                let query = conn.query(updatesql, (err, result) => {
                    if(err) throw err;
                    console.log("Data updated!");
                    res.redirect('/products');
                });
            } else {
                res.send("Id doest not exist");
            }
        });
    });
};

//delete product
const deleteProduct = (req, res) => {
    let id = req.params.id;

    conn.query('SELECT * FROM products WHERE product_id = ?', [id], async (error, result) => {
        if(error) {
            console.log(error);
        }

        if(result.length > 0) {
            let sql = `DELETE FROM products WHERE product_id = ${id}`;
            let query = conn.query(sql, (err, result) => {
                if(err) throw err;
                console.log('Product deleted');
                res.redirect('/products');
            });
        } else {
            res.send('Id does not exist');
        }
    });
};

exports.getProducts = getProducts;
exports.getProductsById = getProductsById;
exports.addProductRoute = addProductRoute;
exports.addProducts = addProducts;
exports.updateProductRoute = updateProductRoute;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;