const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { productService } = require('../services');

const create = catchAsync(async (req, res) => {
  const user = await productService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user.transform());
});

const getAll = catchAsync(async (req, res) => {
  const users = await productService.getUsers(req.query);
  const response = users.map(user => user.transform());
  res.send(response);
});

const get = catchAsync(async (req, res) => {
  const user = await productService.getUserById(req.params.userId);
  res.send(user.transform());
});

const update = catchAsync(async (req, res) => {
  const user = await productService.updateUser(req.params.userId, req.body);
  res.send(user.transform());
});

const deleteOne = catchAsync(async (req, res) => {
  await productService.deleteUser(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  create,
  getAll,
  get,
  update,
  deleteOne,
};
