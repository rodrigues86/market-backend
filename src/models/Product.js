const mongoose = require('mongoose');
const validator = require('validator');
const { pick } = require('lodash');

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      validate(value) {
        if (validator.isEmpty(value) || !validator.isLength(value, { min: 2 }) || validator.isLowercase(value)) {
          throw new Error('Invalid name');
        }
      },
    },
    avatarUrl: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error('Invalid avatarUrl');
        }
      },
    },
    rating: {
      type: Number,
      required: true,
      validate(value) {
        if (!validator.isInt(value, { min: 1, max: 5 })) {
          throw new Error('Invalid rating');
        }
      },
    },
    quantity: {
      type: Number,
      required: true,
      validate(value) {
        if (!validator.isInt(value, { min: 1, max: 1000 })) {
          throw new Error('Invalid quantity');
        }
      },
    },
    price: {
      type: Number,
      required: true,
      unique: false,
      trim: true,
      validate(value) {
        if (!validator.isFloat(value, { min: 0.01, max: 1000.0 })) {
          throw new Error('Invalid price');
        }
      },
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

productSchema.methods.transform = () => {
  const product = this;
  return pick(product.toJSON(), ['id', 'name', 'avatarUrl', 'price', 'rating', 'quantity', 'disabled']);
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
