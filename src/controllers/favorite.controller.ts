import { Request, Response } from "express";
import { ResponseApiType } from "../types/api_types";
import { handlerAnyError } from "../errors/handle_error";
import {
    addFavoriteService,
    removeFavoriteService,
    getFavoritesCountService,
    getAllFavoriteService,
    getUserFavoritesService,
} from "../services/favorite.service";

export async function addFavoriteController(req: Request, res: Response<ResponseApiType>) {
    try {
        const { userId, productId } = req.body;
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
        const { id } = req.params;
        const result = await removeFavoriteService(Number(id));
        res.status(200).json({
            success: true,
            message: "Product has been unfavorited",
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

export async function getUserFavoritesController(req: Request, res: Response<ResponseApiType>) {
    try {
        const userId = Number(req.params.userId);
        const favorites = await getUserFavoritesService(userId);
        res.status(200).json({
            success: true,
            message: "Fetched user favorites successfully",
            data: favorites,
        });
    } catch (error) {
        handlerAnyError(error, res);
    }
}
