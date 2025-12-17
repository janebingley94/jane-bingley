import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserService } from './user.service';
import { PostService } from './post.service';

describe('AppController', () => {
  let appController: AppController;
  let userService: { users: jest.Mock; deleteUserAndPosts: jest.Mock };

  beforeEach(async () => {
    userService = { users: jest.fn(), deleteUserAndPosts: jest.fn() };
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: UserService, useValue: userService },
        { provide: PostService, useValue: {} },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('listUsers', () => {
    it('should query and return users', async () => {
      userService.users.mockResolvedValueOnce([
        { id: 1, email: 'a@a.com', name: null },
      ]);

      await expect(appController.listUsers(0, 20)).resolves.toEqual([
        { id: 1, email: 'a@a.com', name: null },
      ]);

      expect(userService.users).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: undefined,
        orderBy: { id: 'asc' },
      });
    });

    it('should apply searchString filter', async () => {
      userService.users.mockResolvedValueOnce([]);

      await expect(appController.listUsers(0, 20, 'jane')).resolves.toEqual([]);

      expect(userService.users).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {
          OR: [
            { email: { contains: 'jane' } },
            { name: { contains: 'jane' } },
          ],
        },
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user and posts', async () => {
      userService.deleteUserAndPosts.mockResolvedValueOnce({
        id: 1,
        email: 'a@a.com',
        name: null,
      });

      await expect(appController.deleteUser(1)).resolves.toEqual({
        id: 1,
        email: 'a@a.com',
        name: null,
      });

      expect(userService.deleteUserAndPosts).toHaveBeenCalledWith(1);
    });
  });
});
