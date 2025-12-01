import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../application/services/category.service';
import { ICategoryRepository } from '../domain/ports/category-repository.port';
import * as HttpStatusCodes from 'stoker/http-status-codes';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let categoryRepositoryMock: ICategoryRepository;

  beforeEach(() => {
    categoryRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    (CategoryService as any).instance = null;
    categoryService = CategoryService.getInstance(categoryRepositoryMock);
  });

  describe('getAll', () => {
    it('should return all categories', async () => {
      const categories = [{ id: 1, name: 'Food', description: 'Food items' }];
      (categoryRepositoryMock.findAll as any).mockResolvedValue(categories);
      const c = {
        json: vi.fn(),
      };

      await categoryService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ name: 'Food' })]),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 409 if category exists', async () => {
      (categoryRepositoryMock.findByName as any).mockResolvedValue({ id: 1, name: 'Food' });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ name: 'Food' }) },
        json: vi.fn(),
      };

      await categoryService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'A category with this name already exists' }),
        HttpStatusCodes.CONFLICT
      );
    });

    it('should return 201 if category created', async () => {
      (categoryRepositoryMock.findByName as any).mockResolvedValue(null);
      (categoryRepositoryMock.create as any).mockResolvedValue({ id: 1, name: 'Food' });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ name: 'Food' }) },
        json: vi.fn(),
      };

      await categoryService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'Food' }),
        }),
        HttpStatusCodes.CREATED
      );
    });
  });
});
