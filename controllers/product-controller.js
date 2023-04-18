const conn = require('../dbConnection');
const multer = require('multer');
const storage = require('node-sessionstorage')

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

//retrieve product
const getProducts = (req, res) => {
    var cookie = '';
    var role = '3';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
        role = req.cookies.role;
    }
    const search_key = req.query.search;
    const filter_key = req.query.filter;
    if (filter_key != '' && search_key == '') {
        var sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt,
         products.product_sku, products.collection_name, products.gross_wt, products.product_color, 
         products.product_purity, products.product_mat_charge, products.huid_charges, 
         products.certificate_charges, products.total_charges, products.quantity FROM products LEFT JOIN 
         categories ON products.cat_id = categories.id WHERE products.cat_id = '${req.query.filter}'`;
        let query = conn.query(sql, function (err, results) {
            if (err) throw err;
            var product_sql = `SELECT * FROM product_images`;
            conn.query(product_sql, function (err, images) {
                if (err) throw err;
                var totalProduct = [];
                var productData = {};
                results.forEach(result => {
                    var image_array = [];
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
                        total_charges: result.total_charges,
                        quantity: result.quantity
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
                // var getsql = `SELECT * FROM INFORMATION_SCHEMA.products WHERE TABLE_SCHEMA='root' AND TABLE_NAME='products'`;
                var getsql = `SELECT * FROM categories`;
                conn.query(getsql, function (err, cat_names) {
                    if (err) throw err;
                    res.render('products/products-view', {
                        title: 'Products',
                        cookie,
                        role,
                        totalProduct,
                        cat_names
                    });
                })
            })
        });
    } else if(filter_key == '' && search_key != '') {
        var sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt,
         products.product_sku, products.collection_name, products.gross_wt, products.product_color, 
         products.product_purity, products.product_mat_charge, products.huid_charges, 
         products.certificate_charges, products.total_charges, products.quantity FROM products LEFT JOIN 
         categories ON products.cat_id = categories.id WHERE products.cat_id = '${req.query.filter}' 
         OR products.product_name LIKE '%${req.query.search}%' OR products.product_id LIKE '%${req.query.search}%' OR 
         categories.cat_name LIKE '%${req.query.search}%' OR products.product_sku LIKE '%${req.query.search}%' OR 
         products.product_color LIKE '%${req.query.search}%' OR products.product_purity LIKE '%${req.query.search}%'`;
        let query = conn.query(sql, function (err, results) {
            if (err) throw err;
            var product_sql = `SELECT * FROM product_images`;
            conn.query(product_sql, function (err, images) {
                if (err) throw err;
                var totalProduct = [];
                var productData = {};
                results.forEach(result => {
                    var image_array = [];
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
                        total_charges: result.total_charges,
                        quantity: result.quantity
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
                // var getsql = `SELECT * FROM INFORMATION_SCHEMA.products WHERE TABLE_SCHEMA='root' AND TABLE_NAME='products'`;
                var getsql = `SELECT * FROM categories`;
                conn.query(getsql, function (err, cat_names) {
                    if (err) throw err;
                    res.render('products/products-view', {
                        title: 'Products',
                        cookie,
                        role,
                        totalProduct,
                        cat_names
                    });
                })
            })
        });
    }
    else if (req.query.search == '' || req.query.filter == '' || search_key == undefined || filter_key == undefined) {
        var sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt, 
        products.product_sku, products.collection_name, products.gross_wt, products.product_color, 
        products.product_purity, products.product_mat_charge, products.huid_charges, products.certificate_charges,
        products.total_charges, products.quantity FROM products LEFT JOIN categories ON products.cat_id = categories.id`;
        let query = conn.query(sql, function (err, results) {
            if (err) throw err;
            var product_sql = `SELECT * FROM product_images`;
            conn.query(product_sql, function (err, images) {
                if (err) throw err;
                var totalProduct = [];
                var productData = {};
                results.forEach(result => {
                    var image_array = [];
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
                        total_charges: result.total_charges,
                        quantity: result.quantity
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
                // var getsql = `SELECT * FROM INFORMATION_SCHEMA.products WHERE TABLE_SCHEMA='root' AND TABLE_NAME='products'`;
                var getsql = `SELECT * FROM categories`;
                conn.query(getsql, function (err, cat_names) {
                    if (err) throw err;
                    res.render('products/products-view', {
                        title: 'Products',
                        cookie,
                        role,
                        totalProduct,
                        cat_names
                    });
                })
            })
        });
    } else {
        const search_key = req.query.search;
        var sql = `SELECT products.product_id, categories.cat_name, products.product_name, 
        products.product_wt, products.product_sku, products.collection_name, 
        products.gross_wt, products.product_color, products.product_purity, 
        products.product_mat_charge, products.huid_charges, products.certificate_charges, 
        products.total_charges, products.quantity FROM products LEFT JOIN categories ON products.cat_id = categories.id 
        WHERE products.product_name LIKE '%${search_key}%' OR products.product_id LIKE '%${search_key}%' OR 
        categories.cat_name LIKE '%${search_key}%' OR products.product_sku LIKE '%${search_key}%' OR 
        products.product_color LIKE '%${search_key}%' OR products.product_purity LIKE '%${search_key}%' 
        OR products.cat_id LIKE '%${req.query.filter}%'`;
        let query = conn.query(sql, function (err, results) {
            if (err) throw err;
            if (results.length > 0) {
                var product_sql = `SELECT * FROM product_images`;
                conn.query(product_sql, function (err, images) {
                    if (err) throw err;
                    var totalProduct = [];
                    var productData = {};
                    results.forEach(result => {
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
                            total_charges: result.total_charges,
                            quantity: result.quantity
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
                    var getsql = `SELECT * FROM categories`;
                    conn.query(getsql, function (err, cat_names) {
                        if (err) throw err;
                        res.render('products/products-view', {
                            title: 'Products',
                            cookie,
                            role,
                            totalProduct,
                            cat_names
                        });
                    });
                })
            } else {
                res.send("Please enter valid name");
            }
        });
    }
};

//retrieve product by id
const getProductsById = (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    id = req.params.id;
    var sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt, products.product_sku, products.collection_name, products.gross_wt, products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON products.cat_id = categories.id WHERE products.product_id = ${id}`;
    let query = conn.query(sql, function (err, results) {
        if (err) throw err;
        if (results.length > 0) {
            var product_sql = `SELECT product_image FROM product_images WHERE product_id = '${id}'`;
            conn.query(product_sql, function (err, product_images) {
                if (err) throw err;
                res.render('products/single-product', {
                    title: 'PRODUCT',
                    cookie,
                    role: req.cookies.role,
                    products: results,
                    product_images
                });
            })
        } else {
            res.send("Id doest not exist");
        }
    });
};

//add product
const addProductRoute = (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    var sql = 'SELECT cat_name FROM categories';
    conn.query(sql, function (err, results) {
        if (err) throw err;
        var cat_names = results;
        res.render('products/add-product-view', {
            title: 'ADD PRODUCT',
            cookie,
            role: req.cookies.role,
            cat_names
        });
    });
}

const addProducts = (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const cat_name = body.cat_name;
    const files = req.files;
    const sql = `SELECT id FROM categories WHERE cat_name = '${cat_name}'`;
    conn.query(sql, function (err, results) {
        if (err) throw err;
        var cat_id = results[0].id;
        const { product_wt, product_name, product_sku, collection_name, gross_wt, product_color, product_purity, product_mat_charge, huid_charges, certificate_charges, total_charges, quantity } = body;
        conn.query('SELECT product_name FROM products WHERE product_name = ?', [product_name], async (error, result) => {
            if (error) {
                console.log(error);
            }

            if (result.length > 0) {
                return res.send('That product is already exist');
            } else {
                const productData = { cat_id: cat_id, product_wt: product_wt, product_name: product_name, product_sku: product_sku, collection_name: collection_name, gross_wt: gross_wt, product_color: product_color, product_purity: product_purity, product_mat_charge: product_mat_charge, huid_charges: huid_charges, certificate_charges: certificate_charges, total_charges: total_charges, quantity: quantity };
                const sql = 'INSERT INTO products SET ?'
                conn.query(sql, productData, (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        const product_id = results.insertId;
                        console.log("Data inserted!");
                        if (!files) {
                            return res.status(400).send({ message: 'Please upload file.' });
                        }
                        files.forEach(file => {
                            var product_image_query = "INSERT INTO product_images (product_image, product_id) VALUES ('" + file.originalname + "', '" + product_id + "')";
                            // var sql = "INSERT INTO `categories`(`cat_image`, `cat_name`) VALUES ('" + req.file.filename + "', '"+req.body.cat_name+"')";
                            conn.query(product_image_query, function (err, result) {
                                if (err) throw err;
                                console.log("File uploaded");
                            });
                        });
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
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    let product_id = req.params.id;
    let sql_cat_name = 'SELECT cat_name FROM categories';
    conn.query(sql_cat_name, function (err, results) {
        if (err) throw err;
        var cat_names = results;
        let sql = `SELECT products.product_id, categories.cat_name, products.product_name, products.product_wt, products.product_sku, products.collection_name, products.gross_wt, products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, products.certificate_charges, products.total_charges, products.quantity FROM products LEFT JOIN categories ON products.cat_id = categories.id WHERE product_id = ${product_id}`;
        let query = conn.query(sql, (err, results) => {
            if (err) throw err;
            var product_sql = `SELECT product_image FROM product_images WHERE product_id = '${results[0].product_id}'`;
            conn.query(product_sql, function (err, product_images) {
                if (err) throw err;
                res.render('products/update-product-view', {
                    title: 'UPDATE PRODUCT',
                    cookie,
                    role: req.cookies.role,
                    cat_names,
                    product: results[0],
                    product_images
                });
            });
        });
    })
}

const updateProduct = (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const cat_name = body.cat_name;
    const product_id = body.product_id;
    const files = req.files;
    var delete_images = `DELETE FROM product_images WHERE product_id = '${product_id}'`;
    conn.query(delete_images, function (err, result) {
        if (err) throw err;
        console.log("Images deleted")
    })
    var sql = `SELECT id FROM categories WHERE cat_name = '${cat_name}'`;
    conn.query(sql, function (err, results) {
        if (err) throw err;
        var cat_id = results[0].id;
        var sql = `SELECT * FROM products WHERE product_id = ${product_id}`;
        const { product_wt, product_name, product_sku, collection_name, gross_wt, product_color, product_purity, product_mat_charge, huid_charges, certificate_charges, total_charges, quantity } = body;
        conn.query(sql, function (err, results) {
            if (err) throw err;
            if (results.length > 0) {
                let updatesql = `UPDATE products SET cat_id = '${cat_id}', product_wt = '${product_wt}', 
                product_name = '${product_name}', product_sku = '${product_sku}', 
                collection_name = '${collection_name}', gross_wt = '${gross_wt}', 
                product_color = '${product_color}', product_purity = '${product_purity}', 
                product_mat_charge = '${product_mat_charge}', huid_charges = '${huid_charges}', 
                certificate_charges = '${certificate_charges}', total_charges = '${total_charges}', quantity = '${quantity}' WHERE product_id = ${product_id}`;
                let query = conn.query(updatesql, (err, result) => {
                    if (err) throw err;
                    console.log("Data updated!");
                    if (!files) {
                        return res.status(400).send({ message: 'Please upload file.' });
                    }
                    files.forEach(file => {
                        var product_image_query = "INSERT INTO product_images (product_image, product_id) VALUES ('" + file.originalname + "', '" + product_id + "')";
                        // var sql = "INSERT INTO `categories`(`cat_image`, `cat_name`) VALUES ('" + req.file.filename + "', '"+req.body.cat_name+"')";
                        conn.query(product_image_query, function (err, result) {
                            if (err) throw err;
                            console.log("Images uploaded");
                        });
                    });
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
        if (error) {
            console.log(error);
        }

        if (result.length > 0) {
            let sql = `DELETE FROM product_images WHERE product_id = ${id}`;
            let query = conn.query(sql, (err, result) => {
                let sql = `DELETE FROM products WHERE product_id = ${id}`;
                let query = conn.query(sql, (err, result) => {
                    if (err) throw err;
                    console.log('Product deleted');
                    res.redirect('/products');
                });
            });
        } else {
            res.send('Id does not exist');
        }
    });
};

const addToCart = (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const user_id = req.cookies.userId;
    const product_id = req.params.id;
    var sql = `SELECT * FROM products WHERE product_id = '${product_id}'`;
    conn.query(sql, function(err, result){
        if(err) throw err;
        if(result[0].quantity > 0){
            cat_id = JSON.stringify(result[0].cat_id);
            var insertedData = `SELECT * FROM cart WHERE product_id = '${product_id}' and user_id = '${user_id}'`;
            conn.query(insertedData, function(err, cartData){
                if(err) throw err;
                if(user_id) {
                    if(cartData.length == 0){
                        cartData = {user_id: user_id, product_id: product_id, cat_id: cat_id, product_qt: '1'};
                        const sql = 'INSERT INTO cart SET ?'
                        conn.query(sql, cartData, (err, results) => {
                            if (err) throw err;
                            // const path = '/categories/products/'+cat_id;
                            res.redirect('/user/cart');
                        });
                    } else {
                        const quantity = cartData[0].product_qt;
                        cartData = {user_id: user_id, product_id: product_id, cat_id: cat_id, product_qt: quantity+1};
                        const sql = `UPDATE cart SET ? WHERE product_id = '${product_id}' and user_id = '${user_id}'`;
                        conn.query(sql, cartData, (err, results) => {
                            if (err) throw err;
                            // const path = '/categories/products/'+cat_id;
                            res.redirect('/user/cart');
                        });
                    }   
                } else {
                    var productId = req.cookies.productId;
                    var productIds = [];
                    var boolean = 'false';
                    if(productId) {
                        boolean = 'false';
                        try{
                            productIds = JSON.parse(req.cookies.productId);
                        } catch {
                            productIds = req.cookies.productId;
                        }
                        productIds.forEach(productId => {
                            if(productId.product_id == product_id){
                                boolean = 'true';
                                productId.product_qt =  productId.product_qt + 1;
                            }
                        });
    
                        if(boolean == 'false'){
                            var productDetail = {
                                product_id : product_id,
                                cat_id : cat_id,
                                product_qt : 1
                            }
                        }
                    } else {
                        var productDetail = {
                            product_id : product_id,
                            cat_id : cat_id,
                            product_qt : 1
                        }
                    }
                    if(productDetail){
                        productIds.push(productDetail);
                    }
                    res.cookie("productId", JSON.stringify(productIds));
    
                    const path = '/categories/products/'+cat_id;
                    res.redirect(path);
                }
            });
        } else {
            res.status(400).send('Product is out of stock');
        }
    });
}

exports.getProducts = getProducts;
exports.getProductsById = getProductsById;
exports.addProductRoute = addProductRoute;
exports.addProducts = addProducts;
exports.updateProductRoute = updateProductRoute;
exports.updateProduct = updateProduct;
exports.addToCart = addToCart;
exports.deleteProduct = deleteProduct;