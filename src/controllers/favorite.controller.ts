import { Request, Response } from "express";
import { ResponseApiType } from "../types/api_types";
import { handlerAnyError } from "../errors/handle_error";
import { redis } from "../config/redis";
import {
    toggleFavoriteService,
    getFavoritesCountService,
    getAllFavoriteService,
} from "../services/favorite.service";

async function isRateLimited(userId: number, windowInSeconds = 3) {
    const key = `ratelimit:favorite:${userId}`;
    const exists = await redis.exists(key);
    if (exists) return true;

    await redis.set(key, "1", { ex: windowInSeconds });
    return false;
}

export async function toggleFavoriteController(req: Request, res: Response<ResponseApiType>) {
    try {
        const userId = Number(req.user?.id);
        const { productId } = req.body;

        if (!userId || isNaN(userId)) {
            res.status(401).json({ success: false, message: "Unauthorized: Invalid user ID" });
            return;
        }

        if (await isRateLimited(userId)) {
            res.status(429).json({ success: false, message: "Terlalu cepat, coba lagi beberapa detik." });
            return;
        }

        const result = await toggleFavoriteService(userId, Number(productId));

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data ?? undefined,
        });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function getFavoritesCountController(req: Request, res: Response<ResponseApiType>) {
    try {
        const { productId } = req.params;
        const count = await getFavoritesCountService(Number(productId));
        res.status(200).json({
            success: true,
            message: "Fetched favorite count successfully",
            data: { productId: Number(productId), count },
        });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function getAllFavoriteController(req: Request, res: Response<ResponseApiType>) {
    try {
        const favorites = await getAllFavoriteService();
        res.status(200).json({
            success: true,
            message: "Fetched all favorites successfully",
            data: favorites,
        });
    } catch (error) {
        handlerAnyError(error, res);
    }
}
