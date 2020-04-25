const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const faker = require('faker');
const Product = require('../../src/models/Product');

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const productOne = {
  _id: mongoose.Types.ObjectId(),
  name: faker.commerce.productName(),
  avatarUrl: faker.image.food(),
  rating: faker.finance.amount(1, 5),
  quantity: faker.finance.amount(0, 500),
  price: faker.finance.amount(0, 500, 2),
  disabled: faker.random.boolean(),
};

const productTwo = {
  _id: mongoose.Types.ObjectId(),
  name: faker.commerce.productName(),
  avatarUrl: faker.image.food(),
  rating: faker.finance.amount(1, 5),
  quantity: faker.finance.amount(0, 500),
  price: faker.finance.amount(0, 500, 2),
  disabled: faker.random.boolean(),
};

const admin = {
  _id: mongoose.Types.ObjectId(),
  name: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
};

const insert = async users => {
  await Product.insertMany(users.map(user => ({ ...user, password: hashedPassword })));
};

module.exports = {
  productOne,
  productTwo,
  admin,
  insert,
};
