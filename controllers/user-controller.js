const conn = require('../dbConnection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const window = require('window');

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
            const hashedPassword = await bcrypt.hash(password, 8);
            const role = "3";
            const userData = {name: name, email: email, role: role, password: hashedPassword};
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
                                console.log("User registered!");
                                res.redirect('/login');
                            });
                        }
                    });
                }
            });
        }
    });
    // res.send("Register page");
};

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
            let sql = `DELETE FROM users WHERE id = ${id}`;
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
exports.userPermissionRoute = userPermissionRoute;
exports.editUserPermissionRoute = editUserPermissionRoute;
exports.saveUserRolePermission = saveUserRolePermission;