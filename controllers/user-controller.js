const conn = require('../dbConnection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const window = require('window');
const { smtpProtocol, mailoption } = require('../config/emailConfig');
const fs = require('fs');
const otpGenerator = require('otp-generator');
const handlebars = require('handlebars');
const path = require('path');
const storage = require('node-sessionstorage');
const rzp = require('../middleware/razorpay');
const nanoid = require('nanoid');
const generateUniqueId = require('generate-unique-id');
const {LocalStorage} = require('node-localstorage');
const crypto = require('crypto');
const Razorpay = require('razorpay');

//home page route
const homePage =  (req, res) => {
    var cookie = '';
    const user_role = req.cookies.role;
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    // res.send("Home page");
    var sql = 'SELECT * FROM users';
    let query = conn.query(sql, function(err, results) {
        if(err) throw err;
        if(req.cookies?.productId && req.cookies?.userId) {
            try {
                cartDetails = JSON.parse(req.cookies.productId);
            } catch {
                cartDetails = req.cookies.productId;
            }
            cartDetails.forEach(cart => {
                var insertedData = `SELECT * FROM cart WHERE product_id = '${cart.product_id}' and user_id = '${req.cookies.userId}'`;
                conn.query(insertedData, function(err, cartData){
                    if(err) throw err;
                    if(cartData.length == 0){
                        cart_details = {user_id: req.cookies.userId, product_id: cart.product_id, cat_id: cart.cat_id, product_qt: cart.product_qt};
                        const sql = 'INSERT INTO cart SET ?'
                        conn.query(sql, cart_details, (err, results) => {
                            if (err) throw err;
                        });
                    } else {
                        var cart_product_id = JSON.parse(cart.product_id);
                        var cookie_product_id = cartData[0].product_id;
                        if(cookie_product_id == cart_product_id) {
                            cartData[0].product_qt = cartData[0].product_qt + cart.product_qt;
                            quantity = cartData[0].product_qt;
                        }
                        cart_details = {user_id: req.cookies.userId, product_id: cart.product_id, cat_id: cart.cat_id, product_qt: quantity};
                        const sql = `UPDATE cart SET ? WHERE product_id = '${cart.product_id}' and user_id = '${req.cookies.userId}'`;
                        conn.query(sql, cart_details, (err, results) => {
                            if (err) throw err;
                        });
                    } 
                });
            });
            res.clearCookie("productId");
        }
        if(req.cookies.productId == ''){
            res.clearCookie("productId");
        }
        res.render('home-page/home-page',{
            title: 'USERS',
            cookie,
            users: results,
            user_role
        });
    });
};

//user role 
const userRoleRoute =  (req, res) => {
    var cookie = '';
    const user_role = req.cookies.role;
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const sql = `SELECT * FROM users`;
    conn.query(sql, function(err, result) {
        if(err) throw err;
        res.render('user-profile/user-role',{
            title: 'User role',
            cookie,
            user_role,
            users: result
        });
    })
};

const editUserRoleRoute = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    let user_id = req.params.id;
    let role_sql = `SELECT role_id FROM user_role_permission WHERE user_id = '${user_id}'`;
    conn.query(role_sql, function(err, result){
        if(err) throw err;
        var user_roles = result;
        let sql = `SELECT role_id, role_name FROM roles`;
        conn.query(sql, function(err, results) {
            if(err) throw err;
            let sql = `SELECT users.id, roles.role_name, users.name, users.email, users.password FROM users LEFT JOIN roles ON users.role = roles.role_id WHERE id = ${user_id}`;
            conn.query(sql, async function(err, result) {
                if(err) throw err;
                var data = [];
                let boolean = 'false';
                results.forEach(res=>{
                    boolean = 'false';
                    user_roles.forEach(resp=>{
                        if(resp.role_id == res.role_id){
                            boolean = 'true';
                        }
                    })
                    res.isActive = JSON.parse(boolean);
                    data.push(res);
                })
                res.render('user-profile/edit-user-role',{
                    title: 'UPDATE USER ROLE',
                    cookie,
                    user: result[0],
                    data
                });
            });
        });
    });
}

const saveUserRole = (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const user_id = body.id;
    var role = [];
    if(typeof(body.role_name) == 'string'){
        role.push(body.role_name)
    } else{
        role = body.role_name;
    }
    var delete_data = `DELETE FROM user_permission WHERE user_id = ${user_id}`;
    conn.query(delete_data, function(err, result){
        if(err) throw err;
        console.log("Data deleted");
        role.forEach(role_id => {
            const sql = `INSERT INTO user_permission (user_id, role_id) VALUES ('${user_id}', '${role_id}')`;
            conn.query(sql, function(err, result){
                if(err) throw err;
            });
        });
        res.redirect('/user-role');
    })
}

//user profile
const userProfile = (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const userId = req.cookies.userId;
    var sql = `SELECT * FROM users WHERE id = ${userId}`;
    let query = conn.query(sql, function(err, results) {
        if(err) throw err;
        const role = req.cookies.role;
        res.render('user-profile/profile',{
            title: 'Profile Page',
            cookie,
            users: results,
            role
        });
    });
}

//signup 
const signupRoute = function(req, res, next) { 
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    res.render('user-profile/signup',{
        title: 'Sign Up Page',
        cookie
    });
}; 

const register = async (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const name = body.name;
    const email = body.email;
    const password = body.password;
    const confirmPassword = body.confirmpass;
    
    // const { name, email, password, confirmPassword } = req.body;
    conn.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
        if(error) {
            console.log(error);
        }

        if(result.length > 0) {
            res.send('That email is already in use');
        } else if(password !== confirmPassword){
            res.send('Password do not match');
        } else {
            const code = otpGenerator.generate(6, { specialChars: false });
            const hashedPassword = await bcrypt.hash(password, 8);
            const role = "3";
            const userData = {name: name, email: email, role: role, password: hashedPassword, otp: 0, code: code, isActive: 'false'};
            const sql = 'INSERT INTO users SET ?'
            conn.query(sql, userData, (error, results) => {
                if(error) {
                    console.log(error);
                } else {
                    const user_id = results.insertId;
                    const read_permission = "4";
                    const data = {user_id: user_id, role_id: role, permission_id: read_permission};
                    const sql = 'INSERT INTO user_role_permission SET ?'
                    conn.query(sql, data, (error, results) => {
                        if(error) {
                            console.log(error);
                        } else {
                            const roleData = {user_id: user_id, role_id: role};
                            const sql = 'INSERT INTO user_permission SET ?';
                            conn.query(sql, roleData, (err, results) => {
                                if(err) throw err;
                                const userDataSql = `SELECT * FROM users WHERE id = '${user_id}'`;
                                conn.query(userDataSql, function(err, userData){
                                    if(err) throw err;
                                    const templateDir = path.join(__dirname + "../../templates/mailTemplate.html");
                                    const source = fs.readFileSync(templateDir, 'utf-8').toString();
                                    const template = handlebars.compile(source);
                                    const replacements = {
                                        code: userData[0].code,
                                        email: userData[0].email
                                    };
                                    const htmlToSend = template(replacements);
                                    mailoption.to = userData[0].email;
                                    mailoption.subject = "Verification of mail";
                                    mailoption.html = htmlToSend;
    
                                    smtpProtocol.sendMail(mailoption, function (err, response) {
                                        if (error) {
                                            console.log(error);
                                        } else{
                                            smtpProtocol.close();
                                            console.log("User registered! and mail sent");
                                            res.redirect('/login');
                                        }
                                    });
                                })
                            });
                        }
                    });
                }
            });
        }
    });
    // res.send("Register page");
};

const verificationMail = async (req, res) => {
    var sql = `SELECT * FROM users WHERE code = '${req.params.code}'`;
    conn.query(sql, function(err, result){
        if(err) throw err;
        var update_sql = `UPDATE users SET isActive = 'true'`;
        conn.query(update_sql, function(err, results){
            if(err) throw err;
            res.send("Email verified");
        })
    })
}

//login
const loginRoute = function(req, res, next) { 
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    var sql = `SELECT * FROM roles`;
    conn.query(sql, function(err, result){
        if(err) throw err;
        res.render('user-profile/login',{
            title: 'Login Page',
            cookie,
            roles: result
        });
    })
}; 

const login = async (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const email = body.email;
    const password = body.password;
    // const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.send("Email or password is required");
        }
        conn.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            if(error) {
                console.log(error);
            }
            if(!results || !(await bcrypt.compare(password, results[0].password))) {
                res.send("Invalid credentials");
            } else {
                if(results[0].isActive == 'true') {
                    var getRole = `SELECT * FROM user_permission WHERE role_id = '${body.role_name}' and user_id = '${results[0].id}'`;
                    conn.query(getRole, function(err, role_result){
                        if(err) throw err;
                        if(role_result.length>0){
                            role = role_result[0].role_id;
                            const id = results[0].id;
                            const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                                expiresIn: process.env.JWT_EXPIREIN
                            });

                            let object = {
                                token : token ,
                                user : results[0]
                            }

                            res.cookie('jwt_token', JSON.stringify(object));
                            res.cookie('jwt_token', token);
                            res.cookie('userId', results[0].id);
                            res.cookie('userName', results[0].name);
                            res.cookie('userEmail', results[0].email);
                            res.cookie('role', role);

                            res.redirect('/');
                        } else{
                            res.status(404).json({message: "Role does not exist"});
                        }
                    })
                } else {
                    res.send("Please verify your email and then login again");
                }
            }
        });
    } catch (error) {
        // res.send(error);
    }
};

//logout
const logout = async (req, res, next) => {
    // res.clearCookie('jwt_token');
    await res.clearCookie('userEmail');
    await res.clearCookie('userName');
    await res.clearCookie('userId');
    await res.clearCookie('jwt_token');
    await res.clearCookie('role');
    await res.clearCookie('productId');
    await res.clearCookie('catId');
    await res.clearCookie('productQt');

    res.redirect('/');
}

//edit user
const editUserRoute = async (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    let user_id = req.params.id;
    const user_role = req.cookies.role;
    let sql = `SELECT role_name FROM roles`;
    conn.query(sql, function(err, results) {
        if(err) throw err;
        let sql = `SELECT users.id, roles.role_name, users.name, users.email, users.password FROM users LEFT JOIN roles ON users.role = roles.role_id WHERE id = ${user_id}`;
        conn.query(sql, async function(err, result) {
            if(err) throw err;
            res.render('user-profile/edit-user',{
                title: 'UPDATE USER ROLE',
                cookie,
                user: result[0],
                roles: results,
                user_role
            });
        });
    });
}

const editUser = async (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const user_id = body.id;
    const user_name = body.user_name;
    const user_email = body.user_email;
    const role_id = "3";
    const pass = body.user_password;
    var sql = `SELECT * FROM users WHERE id = ${user_id}`;
    conn.query(sql, function(err, results) {
        if(err) throw err;
        if(results.length > 0) {
            let updatesql = `UPDATE users SET id = '${user_id}', name = '${user_name}', 
            email = '${user_email}', role = '${role_id}', 
            password = '${pass}' WHERE id = ${user_id}`;
            let query = conn.query(updatesql, (err, result) => {
                if(err) throw err;
                console.log("Data updated!");
                res.redirect('/');
            });
        } else {
            res.send("Id doest not exist");
        }
    });
}

//delete user
const deleteUser = async (req, res) => {
    let id = req.params.id;

    conn.query('SELECT * FROM users WHERE id = ?', [id], async (error, result) => {
        if(error) {
            console.log(error);
        }
        if(result.length > 0) {
            let sql = `DELETE FROM users WHERE id = '${id}'`;
            let query = conn.query(sql, (err, result) => {
                if(err) throw err;
                console.log('User deleted');
                res.redirect('/');
            });
        } else {
            res.send('Id does not exist');
        }
    });
}

//user role permission
const userPermissionRoute = async (req, res) => {
    var cookie = '';
    const user_role = req.cookies.role;
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const sql = `SELECT * FROM users`;
    conn.query(sql, function(err, result) {
        if(err) throw err;
        res.render('user-profile/user-role-permission',{
            title: 'User Role Permission',
            cookie,
            user_role,
            users: result
        });
    })
}

const editUserPermissionRoute = async (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const user_id = req.params.id;
    var allRoles = `SELECT * FROM roles`;
    conn.query(allRoles , function(err , roles){
        if (err) throw err; 
        var allPermissions = `SELECT * FROM permissions`;
        conn.query(allPermissions, function(err , permissions){
            if (err) throw err;
            var allUserPermissions = `SELECT * FROM user_role_permission WHERE user_id = '${user_id}'`;
            conn.query(allUserPermissions , function(err , userPermissions){
                if (err) throw err;
                var final_data = [];
                var rolePermission = 'false';
                var userPermission = 'false';
                roles.forEach(role_object=>{
                    rolePermission = 'false';
                    let data = {
                        role_id : role_object.role_id,
                        user_id : user_id , 
                        isRole : false,
                        role_name : role_object.role_name,
                        permissions : []
                    }
                    permissions.forEach(permissions_object=>{
                        userPermission = 'false';
                        userPermissions.forEach(userP=>{
                            if(userP.role_id == role_object.role_id && userP.user_id == user_id && userP.permission_id == permissions_object.permission_id){
                                userPermission = 'true';
                            }

                            if(userP.role_id == role_object.role_id){
                                rolePermission = 'true';
                            }
                        })
                        data.isRole = JSON.parse(rolePermission);
                        data.permissions.push({
                            permission_id : permissions_object.permission_id,
                            permission_name : permissions_object.permission,
                            isActive : JSON.parse(userPermission)
                        })
                    })
                    final_data.push(data);
                })
                var userDatasql = `SELECT * FROM users WHERE id = '${user_id}'`;
                conn.query(userDatasql, function(err, userData){
                    if(err) throw err;
                    res.render('user-profile/edit-user-role-permission',{
                        title: 'UPDATE USER ROLE PERMISSION',
                        cookie,
                        final_data,
                        userData: userData[0]
                    }); 
                })
            });
        });
    });
}

const saveUserRolePermission = async (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const user_id = body.id;
    var role_ids = [];
    var delete_role = `DELETE FROM user_permission WHERE user_id = ${user_id}`;
    conn.query(delete_role, function(err, result){
        if(err) throw err;
        console.log("Role Data Deleted");
        if(typeof(body.role_name)=='string'){
            role_ids.push(body.role_name);
        }else{
            role_ids = body.role_name;
        }
        role_ids.forEach(roleId => {
            const add_role_sql = `INSERT INTO user_permission (user_id, role_id) VALUES ('${user_id}', '${roleId}')`;
            conn.query(add_role_sql, function(err, result){
                if(err) throw err;
                console.log("Role Added");
            });
        })
    });
    var permission_id = [];
    var delete_data = `DELETE FROM user_role_permission WHERE user_id = ${user_id}`;
    conn.query(delete_data, function(err, result){
        if(err) throw err;
        console.log("Data deleted");
        if(typeof(body.permission)=='string'){
            permission_id.push(body.permission);
        }else{
            permission_id = body.permission;
        }
        permission_id.forEach(per_id => {
            const sql = `INSERT INTO user_role_permission (user_id, role_id, permission_id) VALUES ('${user_id}', '${per_id[0]}', '${per_id[2]}')`;
            conn.query(sql, function(err, result){
                if(err) throw err;
                console.log("Permission Added");
            });
        });
        res.redirect('/user-role-permission');
    });
}

//forgot password
const forgotPassword = async (req, res) => {
    res.render('user-profile/forgot-password',{
        title: 'Forgot Password',
    });
}

const getOtpVerification = async (req, res) => {
    const userEmail = req.query.email;
    var sql  = `SELECT * FROM users WHERE email = '${userEmail}'`;
    conn.query(sql, function(err, userResult){
        if(err) throw err;
        if(userResult.length > 0) {
            const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            var otp_sql = `Update users SET otp = '${otp}' WHERE email = '${userEmail}'`;
            conn.query(otp_sql, function(err, otp_result){
                if(err) throw err;
                var userDetailsql = `SELECT * FROM users WHERE email = '${userEmail}'`;
                conn.query(userDetailsql, function(err, userDetail){
                    if(err) throw err;
                    const templateDir = path.join(__dirname + "../../templates/otpTemplate.html");
                    const source = fs.readFileSync(templateDir, 'utf-8').toString();
                    const template = handlebars.compile(source);
                    const replacements = {
                        otp: userDetail[0].otp
                    };
                    const htmlToSend = template(replacements);
                    mailoption.to = userDetail[0].email;
                    mailoption.subject = "Forgot Password Mail";
                    mailoption.html = htmlToSend;

                    smtpProtocol.sendMail(mailoption, function (err, response) {
                        if (err) throw err;
                        smtpProtocol.close();
                        console.log("OTP sent over mail");
                    });
                    console.log("OTP sent successfully");
                    res.render('user-profile/get-otp',{
                        title: 'Verify OTP',
                        userData: userDetail[0]
                    });
                });
            });
        } else {
            res.send("Please enter valid email address");
        }
    });
}

const otpVerification = async (req, res) => {
    const getOTP = req.query.otp;
    const userEmail = req.query.email;
    const userPass = req.query.password;
    var sql  = `SELECT otp FROM users WHERE email = '${userEmail}'`;
    conn.query(sql, async function(err, userResult){
        if(err) throw err;
        const usergetOtp = userResult[0].otp;
        if(userResult.length > 0) {
            if(getOTP == usergetOtp) {
                if(userPass == req.query.confirmpass){
                    const hashedPassword = await bcrypt.hash(userPass, 8);
                    var pass_sql = `Update users SET password = '${hashedPassword}' WHERE email = '${userEmail}'`;
                    conn.query(pass_sql, function(err, result){
                        if(err) throw err;
                        console.log("Password updated");
                        const mailoption = {
                            to: userEmail,
                            subject: 'Verification Message',
                            text: 'Password reset successfully! Login with new password'
                        }
                        
                        smtpProtocol.sendMail(mailoption, function (err, info) {
                            if (err) throw err;
                            smtpProtocol.close();
                        });
                        res.redirect('/login');
                    })
                } else{
                    res.send("Password does not match");
                }
            } else {
                res.send("Please enter valid OTP");
            }
        } else {
            res.send("Please enter OTP");
        }
    });
}

const cart = async (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    if(req.cookies.jwt_token) {
        const user_id = req.cookies.userId;
        const cartDatasql = `SELECT * FROM cart WHERE user_id = '${user_id}'`;
        conn.query(cartDatasql, function(err, cartData){
            if(err) throw err;
            var products = [];
            var totalProduct = [];
            var total_charge = [];
            cartData.forEach(data => {  
                const product_sql = `SELECT products.product_id, categories.cat_name, products.product_name, 
                products.product_wt, products.product_sku, products.collection_name, products.gross_wt, 
                products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, 
                products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON 
                products.cat_id = categories.id WHERE product_id = '${data.product_id}'`;
                conn.query(product_sql, function(err, productData){
                    if(err) throw err;
                    var product_sql = `SELECT * FROM product_images WHERE product_id = '${data.product_id}'`;
                    conn.query(product_sql, async function (err, images) {
                        if (err) throw err; 
                        productData.forEach(product => { 
                            products = {
                                product_id: product.product_id,
                                product_images: [],
                                cat_name: product.cat_name,
                                product_name: product.product_name,
                                product_wt: product.product_wt,
                                product_sku: product.product_sku,
                                collection_name: product.collection_name,
                                gross_wt: product.gross_wt,
                                product_color: product.product_color,
                                product_purity: product.product_purity,
                                product_mat_charge: product.product_mat_charge,
                                huid_charges: product.huid_charges,
                                certificate_charges: product.certificate_charges,
                                product_charges: product.total_charges,
                                total_charges: data.product_qt*product.total_charges
                            }
                            images.forEach(image => {
                                if (products.product_id == image.product_id) {
                                    products.product_images.push({
                                        product_image: image.product_image
                                    })
                                }
                            });
                            totalProduct.push(products);
                        });
                    });
                })
            });
            
            setTimeout(() => { 
                var charges = 0;
                totalProduct.forEach(product => {
                    charges=charges+product.total_charges;
                });
                total_charge.push(charges);
                res.render('cart/cart',{
                    title: "Shopping Cart",
                    cookie,
                    products: totalProduct,
                    cartData,
                    role: req.cookies.role,
                    total_charge: total_charge[0]
                })
            }, 1000);
        });
    } else {
        if(req.cookies?.productId){
            try{
                cartDetails = JSON.parse(req.cookies.productId);
            } catch {
                cartDetails = req.cookies.productId;
            }
            var products = [];
            var totalProduct = [];
            var total_charge = [];
            cartDetails.forEach(cart => {   
                const product_sql = `SELECT products.product_id, categories.cat_name, products.product_name, 
                        products.product_wt, products.product_sku, products.collection_name, products.gross_wt, 
                        products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, 
                        products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON 
                        products.cat_id = categories.id WHERE product_id = '${cart.product_id}'`;
                conn.query(product_sql, function(err, productData){
                    if(err) throw err;
                    var product_sql = `SELECT * FROM product_images WHERE product_id = '${cart.product_id}'`;
                    conn.query(product_sql, async function (err, images) {
                        if (err) throw err; 
                        productData.forEach(product => { 
                            products = {
                                product_id: product.product_id,
                                product_images: [],
                                cat_name: product.cat_name,
                                product_name: product.product_name,
                                product_wt: product.product_wt,
                                product_sku: product.product_sku,
                                collection_name: product.collection_name,
                                gross_wt: product.gross_wt,
                                product_color: product.product_color,
                                product_purity: product.product_purity,
                                product_mat_charge: product.product_mat_charge,
                                huid_charges: product.huid_charges,
                                certificate_charges: product.certificate_charges,
                                product_charges: product.total_charges,
                                product_qt: cart.product_qt,
                                total_charges: cart.product_qt*product.total_charges
                            }
                            images.forEach(image => {
                                if (products.product_id == image.product_id) {
                                    products.product_images.push({
                                        product_image: image.product_image
                                    })
                                }
                            });
                            totalProduct.push(products);
                        });
                    });
                });
            });
            setTimeout(() => {
                var charges = 0;
                totalProduct.forEach(product => {
                    charges=charges+product.total_charges;
                });
                total_charge.push(charges);
                res.render('cart/cart-non-logged-in-user',{
                    title: "Shopping Cart",
                    products: totalProduct,
                    total_charge: total_charge[0]
                });
            }, 3000);
        } else {
            res.render('cart/cart-non-logged-in-user',{
                title: "Shopping Cart",
                products: [],
                total_charge: []
            });
        }
    }
}

const removeProductFromCart = async (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    if(req.cookies.jwt_token) { 
        var delete_sql = `DELETE FROM cart WHERE product_id = '${req.params.id}' and user_id = '${req.cookies.userId}'`;
        conn.query(delete_sql, function(err, result){
            if(err) throw err;
            console.log("Product removed from cart");
            res.redirect('/user/cart');
        });
    } else {
        var productId = req.cookies?.productId;
        if(productId){
            try{
                var productId = JSON.parse(req.cookies.productId);
            } catch {
                var productId = req.cookies.productId;
            }
            const index = productId.findIndex(key => 
                key.product_id == req.params.id
            );
            productId.splice(index,1);
            res.cookie("productId", productId);
            res.redirect('/user/cart');
        } else {
            res.redirect('/user/cart');
        }
    }
}

const userOrderCheckout = async (req, res) => {
    var cookie = '';
    if(req.cookies.jwt_token){
        cookie  = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const user_id = req.cookies.userId;
    const cartDatasql = `SELECT * FROM cart WHERE user_id = '${user_id}'`;
    conn.query(cartDatasql, function(err, cartData){
        if(err) throw err;
        var products = [];
        var totalProduct = [];
        var total_charge = [];
        cartData.forEach(data => {  
            const product_sql = `SELECT products.product_id, products.cat_id, categories.cat_name, products.product_name, 
            products.product_wt, products.product_sku, products.collection_name, products.gross_wt, 
            products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, 
            products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON 
            products.cat_id = categories.id WHERE product_id = '${data.product_id}'`;
            conn.query(product_sql, function(err, productData){
                if(err) throw err;
                var product_sql = `SELECT * FROM product_images WHERE product_id = '${data.product_id}'`;
                conn.query(product_sql, async function (err, images) {
                    if (err) throw err; 
                    productData.forEach(product => { 
                        products = {
                            product_id: product.product_id,
                            cat_id: product.cat_id,
                            product_images: [],
                            cat_name: product.cat_name,
                            product_name: product.product_name,
                            product_wt: product.product_wt,
                            product_sku: product.product_sku,
                            collection_name: product.collection_name,
                            gross_wt: product.gross_wt,
                            product_color: product.product_color,
                            product_purity: product.product_purity,
                            product_mat_charge: product.product_mat_charge,
                            huid_charges: product.huid_charges,
                            certificate_charges: product.certificate_charges,
                            product_charges: product.total_charges,
                            product_qt: data.product_qt,
                            total_charges: data.product_qt*product.total_charges
                        }
                        images.forEach(image => {
                            if (products.product_id == image.product_id) {
                                products.product_images.push({
                                    product_image: image.product_image
                                })
                            }
                        });
                        totalProduct.push(products);
                    });
                });
            })
        });
        
        setTimeout(() => {
            var charges = 0;
            totalProduct.forEach(product => {
                charges=charges+product.total_charges;
            });
            total_charge.push(charges);
            if(req.cookies.jwt_token == undefined) {
                res.redirect('/login');
            } else {
                res.render('cart/checkout',{
                    title: 'Checkout',
                    cookie,
                    products: totalProduct,
                    total_charge: total_charge,
                    role: req.cookies.role
                });
            }
        }, 1000);
    });
}

const order = async (req, res) => {
    const body = JSON.parse(JSON.stringify(req.body));
    const options = {
        amount: req.body.total_charge*100,
        currency: 'INR',
        receipt: generateUniqueId(), //any unique id
        payment_capture : true,
        notes: {
            orderType: "Pre",
            product_details: JSON.stringify(body.product_id)
        } 
    }
    try {
        const response = await rzp.orders.create(options);
        res.render('cart/razorpay-checkout', {
            orderId: response.id,
            orderAmount: response.amount
        })
    } catch (error) {
        console.log(error);
        res.status(400).send('not able to establish order');
    }
}

const paymentVerify = async (req, res) => {
    const razorpay_signature =  req.body.response.razorpay_signature;
    const key_secret = "dVYuGy581GvKkrNTFRgy93DY"; 
    let hmac = crypto.createHmac('sha256', key_secret); 
    hmac.update(req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id);
    const generated_signature = hmac.digest('hex');
    var response = {"signatureIsValid":"false"}
    if(razorpay_signature===generated_signature){
        response={"signatureIsValid":"true"};
        // res.send(response);
        var productDetails = [];
        var userId = req.cookies.userId;
        var orderSql = `INSERT INTO orders (order_id, payment_id, signature, user_id) VALUES 
        ('${req.body.response.razorpay_order_id}','${req.body.response.razorpay_payment_id}',
        '${req.body.response.razorpay_signature}','${req.cookies.userId}')`;
        conn.query(orderSql, function(err, result){
            if(err) throw err;
            console.log("Order Successfully Created");
            var orderSql = `SELECT * FROM orders WHERE user_id = '${req.cookies.userId}'`;
            conn.query(orderSql, function(err, orders){
                if(err) throw err;
                orders.forEach(order=>{
                    var data = rzp.orders.fetch(order.order_id).then((orderDocument) => {
                        if(typeof(JSON.parse(orderDocument.notes.product_details))=='string'){
                            let array = [JSON.parse(orderDocument.notes.product_details)];
                            productDetails.push({
                                productData : array,
                                orderId: orderDocument.id,
                                product_price: orderDocument.notes.product_price
                            });
                        }else{
                            productDetails.push({
                                productData : JSON.parse(orderDocument.notes.product_details),
                                orderId: orderDocument.id,
                                product_price: orderDocument.notes.product_price
                            })
                        }
                    });
                })
                setTimeout(() => {
                    productDetails.forEach(product => {
                        product.productData.forEach(products=> {
                            var orderDetails = products.split('-');
                            var orderAvailable = `SELECT * FROM order_details WHERE product_id = '${orderDetails[0]}' AND 
                            cat_id = '${orderDetails[1]}' AND product_qt = '${orderDetails[2]}' AND user_id = '${userId}' 
                            AND order_id = '${product.orderId}' AND product_price = '${orderDetails[3]}'`;
                            conn.query(orderAvailable, function(err, result){
                                if(err) throw err;
                                if(result.length == 0){
                                    var orderDetailsSql = `INSERT INTO order_details (product_id, cat_id, product_qt, user_id, order_id, product_price) 
                                    VALUES ('${orderDetails[0]}','${orderDetails[1]}','${orderDetails[2]}','${userId}', '${product.orderId}', '${orderDetails[3]}')`;
                                    conn.query(orderDetailsSql, function(err, result){
                                        if(err) throw err;
                                        console.log("Order details added");
                                    });
                                    var product_sql =  `SELECT * FROM products WHERE product_id = '${orderDetails[0]}'`;
                                    conn.query(product_sql, function(err, result){
                                        if(err) throw err;
                                        var order_product_quantity = result[0].quantity - orderDetails[2];
                                        var update_product = `UPDATE products SET cat_id = '${result[0].cat_id}', product_wt = '${result[0].product_wt}', 
                                            product_name = '${result[0].product_name}', product_sku = '${result[0].product_sku}', 
                                            collection_name = '${result[0].collection_name}', gross_wt = '${result[0].gross_wt}', 
                                            product_color = '${result[0].product_color}', product_purity = '${result[0].product_purity}', 
                                            product_mat_charge = '${result[0].product_mat_charge}', huid_charges = '${result[0].huid_charges}', 
                                            certificate_charges = '${result[0].certificate_charges}', total_charges = '${result[0].total_charges}', quantity = '${order_product_quantity}' WHERE product_id = '${orderDetails[0]}'`;
                                        conn.query(update_product, function(err, result){
                                            if(err) throw err;
                                            console.log("Product Updated");
                                        })
                                    })
                                }
                            });
                            var clearCart = `DELETE FROM cart WHERE product_id = '${orderDetails[0]}' AND user_id = '${userId}'`;
                            conn.query(clearCart, function(err, result){
                                if(err) throw err;
                                console.log("Cart cleared");
                            });
                        })
                    });
                }, 1000);
            });
        })
        const templateDir = path.join(__dirname + "../../templates/placedOrder.html");
        const source = fs.readFileSync(templateDir, 'utf-8').toString();
        const template = handlebars.compile(source);
        const replacements = {
            userName: req.cookies.userName
        };
        const htmlToSend = template(replacements);
        mailoption.to = req.cookies.userEmail;
        mailoption.subject = "Order Placed";
        mailoption.html = htmlToSend;

        smtpProtocol.sendMail(mailoption, function (err, response) {
            if (err) throw err;
            smtpProtocol.close();
            console.log("Mail sent over email for successful order placed");
        });
        res.redirect('/fetch-order');
    }
    else {
        res.json({success:false, message:"Payment verification failed"});
    }
}

const fetchOrders = async (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    var userId = req.cookies.userId;
    var orderSql = `SELECT * FROM orders WHERE user_id = '${req.cookies.userId}'`;
    conn.query(orderSql, function(err, orders){
        if(err) throw err;
        if(orders){
            var products = [];
            var totalProduct = [];
            var sql = `SELECT * FROM order_details WHERE user_id = '${userId}'`;
            conn.query(sql, function(err, orders){
                if(err) throw err;
                orders.forEach(order => { 
                    const product_sql = `SELECT products.product_id, categories.cat_name, products.product_name, 
                            products.product_wt, products.product_sku, products.collection_name, products.gross_wt, 
                            products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, 
                            products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON 
                            products.cat_id = categories.id WHERE product_id = '${order.product_id}'`;
                    conn.query(product_sql, function(err, productData){
                        if(err) throw err;
                        var product_sql = `SELECT * FROM product_images WHERE product_id = '${order.product_id}'`;
                        conn.query(product_sql, async function (err, images) {
                            if (err) throw err; 
                            productData.forEach(product => { 
                                products = {
                                    product_id: product.product_id,
                                    order_id: order.order_id,
                                    product_images: [],
                                    cat_name: product.cat_name,
                                    product_name: product.product_name,
                                    product_wt: product.product_wt,
                                    product_sku: product.product_sku,
                                    collection_name: product.collection_name,
                                    gross_wt: product.gross_wt,
                                    product_color: product.product_color,
                                    product_purity: product.product_purity,
                                    product_mat_charge: product.product_mat_charge,
                                    huid_charges: product.huid_charges,
                                    certificate_charges: product.certificate_charges,
                                    product_charges: order.product_price,
                                    product_qt: order.product_qt,
                                    total_charges: order.product_qt*order.product_price
                                }
                                images.forEach(image => {
                                    if (products.product_id == image.product_id) {
                                        products.product_images.push({
                                            product_image: image.product_image
                                        })
                                    }
                                });
                                totalProduct.push(products);
                            });
                        });
                    })
                });
                setTimeout(() => {  
                    res.render('order/orders',{
                        title: "ORDER DETAILS",
                        products: totalProduct,
                        cookie,
                        role: req.cookies.role
                    });
                }, 1000);
            }) 
        }
    })
}

const returnOrder = async (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    const body = JSON.parse(JSON.stringify(req.body));
    console.log("Productid:"+body.productId, "Orderid:"+body.orderId);
    var status = `SELECT * FROM order_status WHERE product_id = '${body.productId}' AND order_id = '${body.orderId}' AND user_id = '${req.cookies.userId}'`;
    conn.query(status, function(err, result){
        if(err) throw err;
        if(result.length == 0) {
            var status_sql = `INSERT INTO order_status (product_id, order_id, user_id, status) VALUES ('${body.productId}','${body.orderId}', '${req.cookies.userId}', 'return')`;
            conn.query(status_sql, function(err, result){
                if(err) throw err;
                console.log(result);
                const templateDir = path.join(__dirname + "../../templates/return-order.html");
                const source = fs.readFileSync(templateDir, 'utf-8').toString();
                const template = handlebars.compile(source);
                const replacements = {
                    userName: req.cookies.userName,
                    orderId: body.orderId
                };
                const htmlToSend = template(replacements);
                mailoption.to = req.cookies.userEmail;
                mailoption.subject = "Return request";
                mailoption.html = htmlToSend;
        
                smtpProtocol.sendMail(mailoption, function (err, response) {
                    if (err) throw err;
                    smtpProtocol.close();
                    console.log("Mail sent for return request");
                });
                console.log("Return request is generated");
                res.redirect('/fetch-order');
            });
        } else {
            res.status(200).send("Request is already sent");
        }
    });
}

const returnOrderRequest = async (req, res) => {
    var cookie = '';
    if (req.cookies.jwt_token) {
        cookie = req.headers.cookie.split(' ')[0].split('=')[1].replace(";", "");
    }
    var return_orders_sql = 'SELECT * FROM order_status';
    conn.query(return_orders_sql, function(err, return_orders) {
        if(err) throw err;
        var totalProduct = [];
        var productData = {};
        return_orders.forEach(return_order => {
            var product_sql = `SELECT products.product_id, categories.cat_name, products.product_name, 
            products.product_wt, products.product_sku, products.collection_name, products.gross_wt, 
            products.product_color, products.product_purity, products.product_mat_charge, products.huid_charges, 
            products.certificate_charges, products.total_charges FROM products LEFT JOIN categories ON 
            products.cat_id = categories.id WHERE products.product_id = '${return_order.product_id}'`;
            conn.query(product_sql, function(err, products){
                if(err) throw err;
                var image_sql = `SELECT * FROM product_images WHERE product_id = '${return_order.product_id}'`;
                conn.query(image_sql, function (err, product_images) {
                    if (err) throw err;
                    products.forEach(product => {
                        if(product.product_id == return_order.product_id) {
                            productData = {
                                product_id: product.product_id,
                                product_images: [],
                                cat_name: product.cat_name,
                                product_name: product.product_name,
                                product_wt: product.product_wt,
                                product_sku: product.product_sku,
                                collection_name: product.collection_name,
                                gross_wt: product.gross_wt,
                                product_color: product.product_color,
                                product_purity: product.product_purity,
                                product_mat_charge: product.product_mat_charge,
                                huid_charges: product.huid_charges,
                                certificate_charges: product.certificate_charges,
                                total_charges: product.total_charges,
                                order_id: return_order.order_id,
                                status: return_order.status,
                                user_id: return_order.user_id
                            }
                        }
                        product_images.forEach(image => {
                            if (productData.product_id == image.product_id) {
                                productData.product_images.push({
                                    product_image: image.product_image
                                })
                            }
                        });
                        totalProduct.push(productData);
                    });
                });
            });
        });
        setTimeout(() => {
            res.render('order/return-order', {
                title: "Return Requests",
                role: req.cookies.role,
                cookie,
                products: totalProduct
            });
        }, 1000);
    });
}

const approveRequest = async (req, res) => {
    var update_status_sql = `UPDATE order_status SET product_id = '${req.query.product_id}', 
    order_id = '${req.query.order_id}', user_id = '${req.query.user_id}', status = 'approved' 
    WHERE product_id = '${req.query.product_id}' AND order_id = '${req.query.order_id}' AND user_id = '${req.query.user_id}'`;
    conn.query(update_status_sql, function(err, result){
        if(err) throw err;
        console.log("Request approved");
        res.redirect('/return-orders-request');
    })
}

const rejectRequest = async (req, res) => {
    var update_status_sql = `UPDATE order_status SET product_id = '${req.query.product_id}', 
    order_id = '${req.query.order_id}', user_id = '${req.query.user_id}', status = 'rejected' 
    WHERE product_id = '${req.query.product_id}' AND order_id = '${req.query.order_id}' AND user_id = '${req.query.user_id}'`;
    conn.query(update_status_sql, function(err, result){
        if(err) throw err;
        console.log("Request Rejected");
        res.redirect('/return-orders-request');
    })
}

exports.homePage = homePage;
exports.userRoleRoute = userRoleRoute;
exports.editUserRoleRoute = editUserRoleRoute;
exports.saveUserRole = saveUserRole;
exports.userProfile = userProfile;
exports.signupRoute = signupRoute;
exports.register = register;
exports.login = login;
exports.loginRoute = loginRoute;
exports.editUserRoute = editUserRoute;
exports.editUser = editUser;
exports.deleteUser = deleteUser;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.getOtpVerification = getOtpVerification;
exports.otpVerification = otpVerification;
exports.userPermissionRoute = userPermissionRoute;
exports.editUserPermissionRoute = editUserPermissionRoute;
exports.saveUserRolePermission = saveUserRolePermission;
exports.verificationMail = verificationMail;
exports.cart = cart;
exports.removeProductFromCart = removeProductFromCart;
exports.userOrderCheckout = userOrderCheckout;
exports.order = order;
exports.paymentVerify = paymentVerify;
exports.fetchOrders = fetchOrders;
exports.returnOrder = returnOrder;
exports.returnOrderRequest = returnOrderRequest;
exports.approveRequest = approveRequest;
exports.rejectRequest = rejectRequest;