const conn = require('../../dbConnection');

const readPermissions = (req, res, next) => {
    if(req.cookies){
        const user_id = req.cookies.userId;
        const role_id = req.cookies.role;
        const sql = `SELECT permission_id FROM user_role_permission WHERE user_id = '${user_id}' and role_id = '${role_id}'`;
        conn.query(sql, function(err, results) {
            if(err) throw err;
            var flag  = false;
            results.forEach(result => {
                permission_id = result.permission_id;
                if(permission_id == 4) {
                    flag = true
                }
            });
            if(flag) {
                next();
            } else {
                res.status(404).json({message: "Access Denied"});
            }
        });
    }
}

const createPermissions = (req, res, next) => {
    if(req.cookies){
        user_id = req.cookies.userId;
        const role_id = req.cookies.role;
        const sql = `SELECT permission_id FROM user_role_permission WHERE user_id = '${user_id}' and role_id = '${role_id}'`;
        conn.query(sql, function(err, results) {
            if(err) throw err;
            var flag  = false;
            results.forEach(result => {
                permission_id = result.permission_id;
                if(permission_id == 1) {
                    flag = true
                }
            });
            if(flag) {
                next();
            } else {
                res.status(404).json({message: "Access Denied"});
            }
        });
    }
}

const updatePermissions = (req, res, next) => {
    if(req.cookies){
        user_id = req.cookies.userId;
        const role_id = req.cookies.role;
        const sql = `SELECT permission_id FROM user_role_permission WHERE user_id = '${user_id}' and role_id = '${role_id}'`;
        conn.query(sql, function(err, results) {
            if(err) throw err;
            var flag  = false;
            results.forEach(result => {
                permission_id = result.permission_id;
                if(permission_id == 2) {
                    flag = true
                }
            });
            if(flag) {
                next();
            } else {
                res.status(404).json({message: "Access Denied"});
            }
        });
    }
}

const deletePermissions = (req, res, next) => {
    if(req.cookies){
        user_id = req.cookies.userId;
        const role_id = req.cookies.role;
        const sql = `SELECT permission_id FROM user_role_permission WHERE user_id = '${user_id}' and role_id = '${role_id}'`;
        conn.query(sql, function(err, results) {
            if(err) throw err;
            var flag  = false;
            results.forEach(result => {
                permission_id = result.permission_id;
                if(permission_id == 3) {
                    flag = true
                }
            });
            if(flag) {
                next();
            } else {
                res.status(404).json({message: "Access Denied"});
            }
        });
    }
}

exports.readPermissions = readPermissions;
exports.createPermissions = createPermissions;
exports.updatePermissions = updatePermissions;
exports.deletePermissions = deletePermissions;