import { z } from "zod";
import { selectCategorySchema } from "../../application/dtos/category.dto";
import { ICategory } from "../../domain/entities/ICategory";

export class CategoryApiAdapter {
  static toApiResponse(category: ICategory): z.infer<typeof selectCategorySchema> {
    return {
      id: category.id,
      name: category.name,
      description: category.description || null,
    };
  }

  static toApiResponseList(categories: ICategory[]): z.infer<typeof selectCategorySchema>[] {
    return categories.map(this.toApiResponse);
  }
}