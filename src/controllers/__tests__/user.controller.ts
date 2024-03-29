import request from 'supertest';

import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import app from '../../app';
import * as UserService from '../../services/user.service';
import * as AuthService from '../../services/auth.service';
import * as ChannelService from '../../services/channel.service';
import { UserDocument } from '../../models/user';
import { createToken } from '../../util/jwt';

describe('UserController', () => {
  let user: UserDocument;
  let refreshToken: string;
  let accessToken: string;
  const endpoint = '/users/';

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await UserService.create('native', 'Test', testEmail, 'password');

    refreshToken = createToken(user.id, 'refresh', '7d');
    accessToken = createToken(user.id, 'access', '15m');
  });
  afterEach(clearDB);
  afterAll(closeDB);

  describe('signup', () => {
    it('should be failed with invalid inputs', async () => {
      await request(app)
        .post(endpoint + 'signup')
        .send({})
        .expect(422);
    });

    it('should return tokens and userData', async () => {
      const spy = jest
        .spyOn(AuthService, 'signup')
        .mockReturnValueOnce({ id: '1' } as any);

      const res = await request(app)
        .post(endpoint + 'signup')
        .send({
          name: 'Test',
          email: testEmail,
          password: 'abcD123$',
          confirmPassword: 'abcD123$',
        })
        .expect(201);

      expect(spy).toBeCalled();
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('userData');
    });
  });

  describe('signin', () => {
    it('should return status code 200 if found user with correct password', async () => {
      const spy = jest
        .spyOn(AuthService, 'signin')
        .mockReturnValueOnce({ id: '1' } as any);

      await request(app)
        .post(endpoint + 'signin')
        .send({ email: testEmail, password: 'password' })
        .expect(200);

      expect(spy).toBeCalled();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token and access token', async () => {
      const res = await request(app)
        .get(endpoint + 'refresh-token')
        .set({ Authorization: 'Bearer ' + refreshToken })
        .expect(200);

      expect(res.body.refreshToken).toBeTruthy();
      expect(res.body.accessToken).toBeTruthy();
    });

    it('should be failed without token in header', async () => {
      await request(app)
        .get(endpoint + 'refresh-token')
        .expect(403);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token', async () => {
      const res = await request(app)
        .get(endpoint + 'access-token')
        .set({ Authorization: 'Bearer ' + refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeTruthy();
    });

    it('should be failed without token in header', async () => {
      await request(app)
        .get(endpoint + 'access-token')
        .expect(403);
    });
  });

  describe('sendVerification', () => {
    it('should return a json with message', async () => {
      const spy = jest
        .spyOn(AuthService, 'sendVerification')
        .mockImplementationOnce(() => Promise.resolve('mock'));

      const res = await request(app)
        .post(endpoint + 'verification')
        .send({ email: testEmail })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('checkVerification', () => {
    it('should return a json with message', async () => {
      const spy = jest
        .spyOn(AuthService, 'checkVerification')
        .mockReturnValueOnce({} as any);

      const res = await request(app)
        .get(endpoint + 'verification/:token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('sendRecovery', () => {
    it('should return a json with message', async () => {
      const spy = jest
        .spyOn(AuthService, 'sendRecovery')
        .mockReturnValueOnce(Promise.resolve('mock'));

      const res = await request(app)
        .post(endpoint + 'recovery')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('checkRecovery', () => {
    it('should return a json with message', async () => {
      const spy = jest
        .spyOn(AuthService, 'checkRecovery')
        .mockReturnValueOnce(Promise.resolve(true));

      const res = await request(app)
        .get(endpoint + 'recovery/:token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('resetPassword', () => {
    it('should failed with invalid inputs', async () => {
      await request(app)
        .patch(endpoint + 'recovery/:token/password')
        .send({ password: 'password', confirmPassword: 'password' })
        .expect(422);
    });

    it('should return a json with message', async () => {
      const checkRecoverySpy = jest
        .spyOn(AuthService, 'checkRecovery')
        .mockReturnValueOnce({} as any);
      const resetPasswordSpy = jest
        .spyOn(AuthService, 'resetPassword')
        .mockReturnValueOnce({} as any);

      const res = await request(app)
        .patch(endpoint + 'recovery/:token/password')
        .send({ password: 'abcD123$', confirmPassword: 'abcD123$' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(checkRecoverySpy).toBeCalled();
      expect(resetPasswordSpy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('getPremiumData', () => {
    it('should failed without premium membership', async () => {
      await request(app)
        .get(endpoint + 'premium')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(403);
    });

    it('should return premium data', async () => {
      await UserService.update(user.id, {
        isVerified: true,
        premium: {
          id: 'test',
          name: 'Standard',
          isCancelled: false,
          expiredAt: new Date(new Date().getTime() + 360000),
        },
      });

      const premium = await request(app)
        .get(endpoint + 'premium')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect(200);

      expect(premium).not.toBeNull();
    });
  });

  describe('updateUserName', () => {
    it('should have a name field in request body with at least 4 length', async () => {
      await request(app)
        .patch(endpoint + 'name')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ name: 'a' })
        .expect(422);
    });
  });

  describe('updateUserPassword', () => {
    it('should have currentPassword and confirmPassword fields to be equal', async () => {
      await request(app)
        .patch(endpoint + 'password')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({
          currentPassword: 'password',
          confirmPassword: 'pwd',
          newPassword: 'abcD123$',
        })
        .expect(422);
    });

    it('should have newPassword with strongly secure', async () => {
      await request(app)
        .patch(endpoint + 'password')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({
          currentPassword: 'password',
          confirmPassword: 'password',
          newPassword: 'pwd',
        })
        .expect(422);
    });
  });

  describe('updateUserPicture', () => {
    it('should return a json with message', async () => {
      await request(app)
        .patch(endpoint + 'picture')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ picture: '' })
        .expect(200);
    });
  });

  describe('getChannel', () => {
    it('should return a json with channel', async () => {
      const spy = jest.spyOn(ChannelService, 'findById').mockReturnValueOnce(
        Promise.resolve({
          name: 'Test',
          picture: '',
          isSubscribed: false,
          subscribers: 0,
        })
      );

      const res = await request(app)
        .get(endpoint + 'channel/:id')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.channel).toBeTruthy();
    });
  });

  describe('getSubscribes', () => {
    it('should return a json with channel list and count', async () => {
      const res = await request(app)
        .get(endpoint + 'subscribes')
        .query({ page: 1, max: 10 })
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('channels');
      expect(res.body).toHaveProperty('count');
    });
  });

  describe('getSubscribers', () => {
    it('should return a json with channel list and count', async () => {
      const res = await request(app)
        .get(endpoint + 'subscribers')
        .query({ page: 1, max: 10 })
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('channels');
      expect(res.body).toHaveProperty('count');
    });
  });

  describe('updateSubscribers', () => {
    it('should return a json with message', async () => {
      const spy = jest
        .spyOn(ChannelService, 'updateSubscribers')
        .mockImplementationOnce(() => ({} as any));

      const res = await request(app)
        .patch(endpoint + ':id/subscribers')
        .set({ Authorization: 'Bearer ' + accessToken })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(spy).toBeCalled();
      expect(res.body.message).toBeTruthy();
    });
  });

  describe('deleteAccount', () => {
    it('should be failed without authorization token', async () => {
      await request(app)
        .post(endpoint + 'deletion')
        .expect(403);
    });

    it('should verify google account with tokenId', async () => {
      const verifyGoogleAccountSpy = jest
        .spyOn(AuthService, 'verifyGoogleAccount')
        .mockImplementationOnce(() => ({} as any));

      await request(app)
        .post(endpoint + 'deletion')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ tokenId: 'asdfasdf' });

      expect(verifyGoogleAccountSpy).toBeCalled();
    });

    it('should verify native account without tokenId', async () => {
      const verifyNativeAccountSpy = jest
        .spyOn(AuthService, 'verifyNativeAccount')
        .mockImplementationOnce(() => ({} as any));

      await request(app)
        .post(endpoint + 'deletion')
        .set({ Authorization: 'Bearer ' + accessToken })
        .send({ email: testEmail, password: 'password' });

      expect(verifyNativeAccountSpy).toBeCalled();
    });
  });
});
