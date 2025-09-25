import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { ICategoryRepository } from "../../domain/ports/category-repository.port";
import { CategoryApiAdapter } from "../../infrastructure/adapters/category-api.adapter";
import { CreateRoute, DeleteRoute, GetByIdRoute, ListRoute, UpdateRoute } from "@/categories/infrastructure/controllers/category.routes";
import { ICategoryService } from "@/categories/domain/ports/category-service.port";


export class CategoryService implements ICategoryService {
  private static instance: CategoryService;

  constructor(private readonly categoryRepository: ICategoryRepository) {}

  public static getInstance(categoryRepository: ICategoryRepository): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService(categoryRepository);
    }
    return CategoryService.instance;
  }

  getAll = createHandler<ListRoute>(async (c) => {
    const categories = await this.categoryRepository.findAll();
    return c.json(
      {
        success: true,
        data: CategoryApiAdapter.toApiResponseList(categories),
        message: "Categories retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getById = createHandler<GetByIdRoute>(async (c) => {
    const id = c.req.param("id");
    const category = await this.categoryRepository.findById(Number(id));

    if (!category) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Category not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        data: CategoryApiAdapter.toApiResponse(category),
        message: "Category retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  create = createHandler<CreateRoute>(async (c) => {
    const data = c.req.valid("json");

    const existingCategory = await this.categoryRepository.findByName(data.name);
    if (existingCategory) {
      return c.json(
        {
          success: false,
          data: null,
          message: "A category with this name already exists",
        },
        HttpStatusCodes.CONFLICT
      );
    }

    const category = await this.categoryRepository.create({
      name: data.name,
      description: data.description,
    });

    return c.json(
      {
        success: true,
        data: CategoryApiAdapter.toApiResponse(category),
        message: "Category created successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  update = createHandler<UpdateRoute>(async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const category = await this.categoryRepository.findById(Number(id));
    if (!category) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Category not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    if (data.name && data.name !== category.name) {
      const existingCategory = await this.categoryRepository.findByName(data.name);
      if (existingCategory && existingCategory.id !== Number(id)) {
        return c.json(
          {
            success: false,
            data: null,
            message: "A category with this name already exists",
          },
          HttpStatusCodes.CONFLICT
        );
      }
    }

    const updatedCategory = await this.categoryRepository.update(Number(id), {
      name: data.name,
      description: data.description,
    });

    return c.json(
      {
        success: true,
        data: CategoryApiAdapter.toApiResponse(updatedCategory),
        message: "Category updated successfully",
      },
      HttpStatusCodes.OK
    );
  });

  delete = createHandler<DeleteRoute>(async (c) => {
    const id = c.req.param("id");
    
    const category = await this.categoryRepository.findById(Number(id));
    if (!category) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Category not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    try {
      await this.categoryRepository.delete(Number(id));
      return c.json(
        {
          success: true,
          data: { deleted: true },
          message: "Category deleted successfully",
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Category is in use",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }
  });
}