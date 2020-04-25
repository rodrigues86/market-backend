const mongoose = require('mongoose');
const validator = require('validator');
const { pick } = require('lodash');

const orderSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shoppingCart: {
      total: { type: Number, required: true },
      items: [
        {
          product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
          promoPrice: { type: Number },
          discountPercent: { type: Number },
          quantity: { type: Number },
        },
      ],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    obs: { type: String },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

orderSchema.methods.transform = () => {
  const order = this;
  return pick(order.toJSON(), ['id', 'name', 'price', 'disabled']);
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
