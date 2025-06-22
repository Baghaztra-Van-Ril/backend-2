import { Request, Response } from "express";
import { ResponseApiType } from "../types/api_types";
import { handlerAnyError } from "../errors/handle_error";
import {
    addFavoriteService,
    removeFavoriteService,
    getFavoritesCountService
} from "../services/favorite.service";

export async function addFavoriteController(req: Request, res: Response<ResponseApiType>) {
    try {
        const { userId, productId } = req.body;
        // const { productId } = req.body;
        // const userId = 1; // dummy userId, replace with actual userId from auth middleware
        const result = await addFavoriteService(userId, productId);
        res.status(201).json({
            success: true,
            message: "Product has been favorited",
            data: result,
        });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function removeFavoriteController(req: Request, res: Response<ResponseApiType>) {
    try {
        const { userId, productId } = req.body;
        const result = await removeFavoriteService(userId, productId);
        res.status(200).json({
            success: true,
            message: "Product has been unfavorited",
            data: result,
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
