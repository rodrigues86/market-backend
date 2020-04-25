const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Product } = require('../../src/models');
const { productOne, productTwo, admin, insert } = require('../fixtures/product.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

describe('Product routes', () => {
  describe('POST /v1/product', () => {
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

    test('should return 201 and successfully create new user if data is ok', async () => {
      await insert([admin]);

      const res = await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.CREATED);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({ id: expect.anything(), name: newProduct.name, email: newProduct.email, role: newProduct.role });

      const dbUser = await Product.findById(res.body.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newProduct.password);
      expect(dbUser).toMatchObject({ name: newProduct.name, email: newProduct.email, role: newProduct.role });
    });

    test('should be able to create an admin as well', async () => {
      await insert([admin]);
      newProduct.role = 'admin';

      const res = await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.CREATED);

      expect(res.body.role).toBe('admin');

      const dbUser = await Product.findById(res.body.id);
      expect(dbUser.role).toBe('admin');
    });

    test('should return 401 error is access token is missing', async () => {
      await request(app)
        .post('/v1/product')
        .send(newProduct)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if logged in user is not admin', async () => {
      await insert([productOne]);

      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 error if email is invalid', async () => {
      await insert([admin]);
      newProduct.email = 'invalidEmail';

      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insert([admin, productOne]);
      newProduct.email = productOne.email;

      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      await insert([admin]);
      newProduct.password = 'passwo1';

      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      await insert([admin]);
      newProduct.password = 'password';

      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.BAD_REQUEST);

      newProduct.password = '1111111';

      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if role is neither user nor admin', async () => {
      await insert([admin]);
      newProduct.role = 'invalid';

      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/product', () => {
    test('should return 200 and all users', async () => {
      await insert([productOne, productTwo, admin]);

      const res = await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toEqual({
        id: productOne._id.toHexString(),
        name: productOne.name,
        email: productOne.email,
        role: productOne.role,
      });
    });

    test('should return 401 if access token is missing', async () => {
      await insert([productOne, productTwo, admin]);

      await request(app)
        .get('/v1/product')
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if a non-admin is trying to access all users', async () => {
      await insert([productOne, productTwo, admin]);

      await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should correctly apply filter on name field', async () => {
      await insert([productOne, productTwo, admin]);

      const res = await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ name: productOne.name })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(productOne._id.toHexString());
    });

    test('should correctly apply filter on role field', async () => {
      await insert([productOne, productTwo, admin]);

      const res = await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ role: 'user' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe(productOne._id.toHexString());
      expect(res.body[1].id).toBe(productTwo._id.toHexString());
    });

    test('should correctly sort returned array if descending sort param is specified', async () => {
      await insert([productOne, productTwo, admin]);

      const res = await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'role:desc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(3);
      expect(res.body[0].id).toBe(productOne._id.toHexString());
    });

    test('should correctly sort returned array if ascending sort param is specified', async () => {
      await insert([productOne, productTwo, admin]);

      const res = await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'role:asc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(3);
      expect(res.body[0].id).toBe(admin._id.toHexString());
    });

    test('should limit returned array if limit param is specified', async () => {
      await insert([productOne, productTwo, admin]);

      const res = await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(2);
    });

    test('should return the correct page if page and limit params are specified', async () => {
      await insert([productOne, productTwo, admin]);

      const res = await request(app)
        .get('/v1/product')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: 2, limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(admin._id.toHexString());
    });
  });

  describe('GET /v1/product/:userId', () => {
    test('should return 200 and the user object if data is ok', async () => {
      await insert([productOne]);

      const res = await request(app)
        .get(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({
        id: productOne._id.toHexString(),
        email: productOne.email,
        name: productOne.name,
        role: productOne.role,
      });
    });

    test('should return 401 error if access token is missing', async () => {
      await insert([productOne]);

      await request(app)
        .get(`/v1/product/${productOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to get another user', async () => {
      await insert([productOne, productTwo]);

      await request(app)
        .get(`/v1/product/${productTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and the user object if admin is trying to get another user', async () => {
      await insert([productOne, admin]);

      await request(app)
        .get(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insert([admin]);

      await request(app)
        .get('/v1/product/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user is not found', async () => {
      await insert([admin]);

      await request(app)
        .get(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/product/:userId', () => {
    test('should return 204 if data is ok', async () => {
      await insert([productOne]);

      await request(app)
        .delete(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await Product.findById(productOne._id);
      expect(dbUser).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await insert([productOne]);

      await request(app)
        .delete(`/v1/product/${productOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to delete another user', async () => {
      await insert([productOne, productTwo]);

      await request(app)
        .delete(`/v1/product/${productTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 204 if admin is trying to delete another user', async () => {
      await insert([productOne, admin]);

      await request(app)
        .delete(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insert([admin]);

      await request(app)
        .delete('/v1/product/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user already is not found', async () => {
      await insert([admin]);

      await request(app)
        .delete(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/product/:userId', () => {
    test('should return 200 and successfully update user if data is ok', async () => {
      await insert([productOne]);
      const updateBody = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'newPassword1',
      };

      const res = await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({
        id: productOne._id.toHexString(),
        name: updateBody.name,
        email: updateBody.email,
        role: 'user',
      });

      const dbUser = await Product.findById(productOne._id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(updateBody.password);
      expect(dbUser).toMatchObject({ name: updateBody.name, email: updateBody.email, role: 'user' });
    });

    test('should return 401 error if access token is missing', async () => {
      await insert([productOne]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .send(updateBody)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user is updating another user', async () => {
      await insert([productOne, productTwo]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/product/${productTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and successfully update user if admin is updating another user', async () => {
      await insert([productOne, admin]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 404 if admin is updating another user that is not found', async () => {
      await insert([admin]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insert([admin]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/product/invalidId`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      await insert([productOne]);
      const updateBody = { email: 'invalidEmail' };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already taken', async () => {
      await insert([productOne, productTwo]);
      const updateBody = { email: productTwo.email };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should not return 400 if email is my email', async () => {
      await insert([productOne]);
      const updateBody = { email: productOne.email };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 400 if password length is less than 8 characters', async () => {
      await insert([productOne]);
      const updateBody = { password: 'passwo1' };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password does not contain both letters and numbers', async () => {
      await insert([productOne]);
      const updateBody = { password: 'password' };

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);

      updateBody.password = '11111111';

      await request(app)
        .patch(`/v1/product/${productOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
