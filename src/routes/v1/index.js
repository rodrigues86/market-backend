const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const productRoute = require('./product');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/product', productRoute);

module.exports = router;
