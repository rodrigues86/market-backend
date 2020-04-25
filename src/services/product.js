const httpStatus = require('http-status');
const { pick } = require('lodash');
const AppError = require('../utils/AppError');
const { Product } = require('../models');
const { getQueryOptions } = require('../utils/service.util');

const checkDuplicateEmail = async (email, excludeUserId) => {
  const product = await Product.findOne({ email, _id: { $ne: excludeUserId } });
  if (product) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
};

const create = async userBody => {
  await checkDuplicateEmail(userBody.email);
  const product = await Product.create(userBody);
  return product;
};

const getAll = async query => {
  const filter = pick(query, ['name', 'role']);
  const options = getQueryOptions(query);
  const products = await Product.find(filter, null, options);
  return products;
};

const get = async userId => {
  const product = await Product.findById(userId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  return product;
};

const getUserByEmail = async email => {
  const product = await Product.findOne({ email });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email');
  }
  return product;
};

const update = async (userId, updateBody) => {
  const product = await get(userId);
  if (updateBody.email) {
    await checkDuplicateEmail(updateBody.email, userId);
  }
  Object.assign(product, updateBody);
  await product.save();
  return product;
};

const deleteOne = async userId => {
  const product = await get(userId);
  await product.remove();
  return product;
};

module.exports = {
  create,
  getAll,
  get,
  getUserByEmail,
  update,
  deleteOne,
};
