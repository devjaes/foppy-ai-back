import { createRouter } from "@/core/infrastructure/lib/create-app";
import * as routes from "./category.routes";
import { PgCategoryRepository } from "../adapters/category.repository";
import { CategoryService } from "../../application/services/category.service";

const categoryRepository = PgCategoryRepository.getInstance();
const categoryService = CategoryService.getInstance(categoryRepository);

const router = createRouter()
  .openapi(routes.list, categoryService.getAll)
  .openapi(routes.getById, categoryService.getById)
  .openapi(routes.create, categoryService.create)
  .openapi(routes.update, categoryService.update)
  .openapi(routes.delete_, categoryService.delete);

export default router;