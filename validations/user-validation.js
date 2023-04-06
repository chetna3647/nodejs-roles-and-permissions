const { check, validationResult } = require('express-validator');

exports.createValidation = [
    check('name').notEmpty().withMessage('Name is required'),
    check('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid Email Address'),
    check('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }),

    (req, res, next) => {
        const error = validationResult(req);
        if(!error.isEmpty()) {
            const error_array = error.array();
            return res.status(422).json({message: error_array});
        } else {
            return next();
        }
    }
];

exports.loginUserValidation = [
    check('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid Email Address'),
    check('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }),

    (req, res, next) => {
        const error = validationResult(req);
        if(!error.isEmpty()) {
            const error_array = error.array();
            return res.status(422).json({message: error_array});
        } else {
            return next();
        }
    }
];