const express = require('express');
const userController = require('../controllers/user-controller');
const userValidation = require('../validations/user-validation');
const permissions = require('../middleware/permissions/permissions');

const router = express.Router();

//get user
router.get('/', userController.homePage);

router.get('/user-profile', userController.userProfile);

//signup route
router.get('/signup', userController.signupRoute);
router.post('/register', userController.register);

//user-role
router.get('/user-role', userController.userRoleRoute); 
router.get('/users/edit-user-role/:id', userController.editUserRoleRoute);
router.post('/save-user-role', userController.saveUserRole);

//user-permission
router.get('/user-role-permission', userController.userPermissionRoute);
router.get('/users/edit-user-role-permission/:id', userController.editUserPermissionRoute);
router.post('/save-user-role-permission', userController.saveUserRolePermission);

//login route
router.get('/login', userController.loginRoute);
router.post('/user-login', userController.login);

//update user route
router.get('/users/edit-user/:id', permissions.updatePermissions, userController.editUserRoute);
router.post('/save-user', userController.editUser);

//delete user route
router.get('/users/delete-user/:id', permissions.deletePermissions, userController.deleteUser);

router.get('/logout', userController.logout);

module.exports = router;