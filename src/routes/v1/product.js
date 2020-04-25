const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const { productController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), productController.create)
  .get(auth('getUsers'), validate(userValidation.getUsers), productController.getAll);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), productController.get)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), productController.update)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), productController.deleteOne);

module.exports = router;
