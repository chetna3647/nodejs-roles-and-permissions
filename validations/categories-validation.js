const { check, validationResult } = require('express-validator');

exports.categoriesValidation = [
    check('cat_image').notEmpty().withMessage('You must select an image.'),
    check('cat_name').notEmpty().withMessage('Category name is required'),

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