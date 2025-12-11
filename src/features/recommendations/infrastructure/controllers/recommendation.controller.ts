import { createRouter } from "@/core/infrastructure/lib/create-app";
import * as routes from "./recommendation.routes";
import { PgRecommendationRepository } from "../adapters/pg-recommendation.repository";
import { toResponseDTO } from "../../application/dtos/recommendation.dto";
import { Context } from "hono";
import * as HttpStatusCodes from "stoker/http-status-codes";

const recommendationRepository = PgRecommendationRepository.getInstance();

const getPendingHandler = async (c: Context) => {
  try {
    const userId = c.req.query("userId")?.toString();

    if (!userId) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User ID not found in context",
        },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    const recommendations = await recommendationRepository.findPendingByUserId(
      Number(userId)
    );

    return c.json(
      {
        success: true,
        data: recommendations.map(toResponseDTO),
        message: "Recommendations retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error getting pending recommendations:", error);
    return c.json(
      {
        success: false,
        data: null,
        message: "Failed to retrieve recommendations",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

const markAsViewedHandler = async (c: Context) => {
  try {
    const { id } = c.req.param();

    const recommendation = await recommendationRepository.findById(Number(id));
    if (!recommendation) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Recommendation not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    await recommendationRepository.markAsViewed(Number(id));

    return c.json(
      {
        success: true,
        data: { success: true },
        message: "Recommendation marked as viewed",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error marking recommendation as viewed:", error);
    return c.json(
      {
        success: false,
        data: null,
        message: "Failed to mark recommendation as viewed",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

const markAsDismissedHandler = async (c: Context) => {
  try {
    const { id } = c.req.param();

    const recommendation = await recommendationRepository.findById(Number(id));
    if (!recommendation) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Recommendation not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    await recommendationRepository.markAsDismissed(Number(id));

    return c.json(
      {
        success: true,
        data: { success: true },
        message: "Recommendation dismissed successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error dismissing recommendation:", error);
    return c.json(
      {
        success: false,
        data: null,
        message: "Failed to dismiss recommendation",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

const markAsActedHandler = async (c: Context) => {
  try {
    const { id } = c.req.param();

    const recommendation = await recommendationRepository.findById(Number(id));
    if (!recommendation) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Recommendation not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    await recommendationRepository.markAsActed(Number(id));

    return c.json(
      {
        success: true,
        data: { success: true },
        message: "Recommendation marked as acted",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error marking recommendation as acted:", error);
    return c.json(
      {
        success: false,
        data: null,
        message: "Failed to mark recommendation as acted",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

const removeDuplicatesHandler = async (c: Context) => {
  try {
    const userId = c.req.query("userId")?.toString();

    if (!userId) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User ID not found in context",
        },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    const removed = await recommendationRepository.removeDuplicatesByUserId(
      Number(userId)
    );

    return c.json(
      {
        success: true,
        data: { removed },
        message: `Removed ${removed} duplicate recommendation(s)`,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error removing duplicate recommendations:", error);
    return c.json(
      {
        success: false,
        data: null,
        message: "Failed to remove duplicate recommendations",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

const router = createRouter()
  .openapi(routes.getPending, getPendingHandler)
  .openapi(routes.markAsViewed, markAsViewedHandler)
  .openapi(routes.markAsDismissed, markAsDismissedHandler)
  .openapi(routes.markAsActed, markAsActedHandler)
  .openapi(routes.removeDuplicates, removeDuplicatesHandler);

export default router;
