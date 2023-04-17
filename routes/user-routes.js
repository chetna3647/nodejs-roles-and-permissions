const express = require('express');
const userController = require('../controllers/user-controller');
const userValidation = require('../validations/user-validation');
const permissions = require('../middleware/permissions/permissions');

const router = express.Router();

//get user
router.get('/', userController.homePage);
router.get('/user-profile', userController.userProfile);
router.get('/user/cart', userController.cart);
router.get('/product/remove/:id', userController.removeProductFromCart);
router.get('/user/checkout', userController.userOrderCheckout);
router.post('/user/order', userController.order);
router.get('/fetch-order', userController.fetchOrders);
router.post('/payment/verify', userController.paymentVerify);
router.post('/return-order', userController.returnOrder);
router.get('/return-orders-request', userController.returnOrderRequest);
router.get('/approve-request', userController.approveRequest);
router.get('/reject_request', userController.rejectRequest);

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

//forgot password
router.get('/user/forgot-password', userController.forgotPassword);
router.get('/user/otp-verification', userController.getOtpVerification);
router.get('/user/otp-verify', userController.otpVerification);

router.get('/verification/:code', userController.verificationMail);

router.get('/logout', userController.logout);

module.exports = router;