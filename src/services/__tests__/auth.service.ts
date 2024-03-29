import { connectDB, clearDB, closeDB } from '../../test/db';
import { testEmail } from '../../test/variables';
import * as AuthService from '../auth.service';
import * as UserService from '../user.service';
import { UserDocument } from '../../models/user';

jest.mock('../email.service.ts');

describe('AuthService', () => {
  let user: UserDocument;

  beforeAll(connectDB);
  beforeEach(async () => {
    user = await AuthService.signup('Test', testEmail, 'password');
  });
  afterEach(clearDB);
  afterAll(closeDB);

  describe('signup', () => {
    it('should create a new user', async () => {
      expect(user).toHaveProperty('_id');
    });

    it('should be failed if there is existing email', async () => {
      await expect(
        AuthService.signup('Test', testEmail, 'password')
      ).rejects.toThrow();
    });

    it('should hash a password', async () => {
      expect(user.password).not.toEqual('password');
    });
  });

  describe('signin', () => {
    it('should sign in a user', async () => {
      await expect(
        AuthService.signin(user.email, 'password')
      ).resolves.not.toThrow();
    });
  });

  describe('googleSignin', () => {
    it('should only receive valid token', async () => {
      await expect(AuthService.googleSignin('123456')).rejects.toThrow();
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      const updatedUser = await AuthService.updatePassword(
        user.id,
        'password',
        'newPassword'
      );

      expect(updatedUser.password).not.toEqual(user.password);
    });

    it('should hash password', async () => {
      const updatedUser = await AuthService.updatePassword(
        user.id,
        'password',
        'newPassword'
      );

      expect(updatedUser.password).not.toEqual('newPassword');
    });
  });

  describe('sendVerification', () => {
    it('should return verification token', async () => {
      const token = await AuthService.sendVerification(user.email);

      expect(token).toBeDefined();
    });

    it("should be failed if email doesn't exist", async () => {
      await expect(
        AuthService.sendVerification('noreply@watchtree.net')
      ).rejects.toThrow();
    });

    it('should be failed if user already verified', async () => {
      await UserService.update(user.id, { isVerified: true });

      await expect(AuthService.sendVerification(user.email)).rejects.toThrow();
    });
  });

  describe('checkVerification', () => {
    it('should update verified status', async () => {
      const token = await AuthService.sendVerification(user.email);
      const updatedUser = await AuthService.checkVerification(token);

      expect(updatedUser.isVerified).toBeTruthy();
    });

    it('should be failed if token is invalid', async () => {
      await expect(AuthService.checkVerification('asdfasdf')).rejects.toThrow();
    });
  });

  describe('sendRecovery', () => {
    it('should return a recovery token', async () => {
      const token = await AuthService.sendRecovery(user.email);

      expect(token).toBeDefined();
    });

    it("should be failed if email doesn't exist", async () => {
      await expect(
        AuthService.sendRecovery('noreply@watchtree.net')
      ).rejects.toThrow();
    });
  });

  describe('checkRecovery', () => {
    it('should return userId', async () => {
      const token = await AuthService.sendRecovery(user.email);
      const result = await AuthService.checkRecovery(token);

      expect(result).toBeTruthy();
    });

    it('should be failed if token is invalid', async () => {
      await expect(AuthService.checkRecovery('asdfasdf')).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should update password', async () => {
      const updatedUser = await AuthService.resetPassword(
        user.id,
        'newPassword'
      );

      expect(updatedUser.password).not.toEqual(user.password);
    });

    it('should be failed if token is invalid', async () => {
      await expect(
        AuthService.resetPassword('asdfasdf', 'newPassword')
      ).rejects.toThrow();
    });
  });

  describe('verifyNativeAccount', () => {
    it('should take user id, email, and password', async () => {
      await expect(
        AuthService.verifyNativeAccount(user.id, testEmail, 'password')
      ).resolves.not.toThrow();
    });

    it('should be failed if email not matched', async () => {
      await expect(
        AuthService.verifyNativeAccount(user.id, 'asdf@test.com', 'password')
      ).rejects.toThrow();
    });

    it('should be failed if password not matched', async () => {
      await expect(
        AuthService.verifyNativeAccount(user.id, testEmail, 'pwd')
      ).rejects.toThrow();
    });
  });

  describe('verifyGoogleAccount', () => {
    it('should be failed with invalid tokenId', async () => {
      await expect(
        AuthService.verifyGoogleAccount(user.id, 'asdfasdf')
      ).rejects.toThrow();
    });
  });
});
