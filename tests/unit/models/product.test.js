const faker = require('faker');
const { Product } = require('../../../src/models');

describe('Product model', () => {
  describe('Product validation', () => {
    let newProduct;
    beforeEach(() => {
      newProduct = {
        name: faker.commerce.productName(),
        avatarUrl: faker.image.food(),
        rating: faker.finance.amount(1, 5),
        quantity: faker.finance.amount(0, 500),
        price: faker.finance.amount(0, 500, 2),
        disabled: faker.random.boolean(),
      };
    });

    // test('should correctly validate a valid product', async () => {
    //   newProduct.rating = 2;
    //   newProduct.quantity = 3;
    //   newProduct.price = 23.32;
    //   await expect(new Product(newProduct).validate()).resolves.toBeUndefined();
    // });

    test('should throw a validation error if name is number', async () => {
      newProduct.name = null;
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });

    test('should throw a validation error if name is lowercase full', async () => {
      newProduct.name = 'massa';
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });

    test('should throw a validation error if password length is less than 2 characters', async () => {
      newProduct.name = 'r';
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });

    test('should throw a validation error if quantity does not contain numbers', async () => {
      newProduct.quantity = 'fewfewfw';
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });

    test('should throw a validation error if quantity is bigger than 1000', async () => {
      newProduct.quantity = 1001;
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });

    test('should throw a validation error if quantity is less than 0', async () => {
      newProduct.quantity = -1;
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });

    test('should throw a validation error if rating is bigger than 5', async () => {
      newProduct.rating = 6;
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });

    test('should throw a validation error if rating is less than 0', async () => {
      newProduct.rating = -1;
      await expect(new Product(newProduct).validate()).rejects.toThrow();
    });
  });

  describe('Product toJSON()', () => {
    test('should not return user password when toJSON is called', () => {
      const newProduct = {
        name: faker.commerce.productName(),
        avatarUrl: faker.image.food(),
        rating: faker.finance.amount(1, 5),
        quantity: faker.finance.amount(0, 500),
        price: faker.finance.amount(0, 500, 2),
        disabled: faker.random.boolean(),
      };
      expect(new Product(newProduct).toJSON()).not.toHaveProperty('password');
    });
  });
});
