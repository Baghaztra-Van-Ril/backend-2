import { Request, Response, NextFunction } from "express";
import { ResponseApiType } from "../types/api_types";
import { handlerAnyError } from "../errors/handle_error";
import {
    getAllPromosService,
    getActivePromosService,
    getPromoByIdService,
    createPromoService,
    updatePromoService,
    deletePromoService
} from "../services/promo.service";

export async function getAllPromoController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const promos = await getAllPromosService();
        res.status(200).json({ success: true, message: "Fetched all promos successfully", data: promos });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function getActivePromoController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const activePromos = await getActivePromosService();
        res.status(200).json({ success: true, message: "Fetched active promos successfully", data: activePromos });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function getPromoByIdController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { id } = req.params;
        const promo = await getPromoByIdService(Number(id));
        res.status(200).json({ success: true, message: `Fetched promo with id: ${id}`, data: promo });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function createPromoController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { productId, discount } = req.body;
        const filePath = req.file?.path;
        if (!filePath) throw new Error("Image file is required");
        const newPromo = await createPromoService(Number(productId), Number(discount), filePath);
        res.status(201).json({ success: true, message: "Promo successfully created", data: newPromo });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function updatePromoController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { id } = req.params;
        const { discount, isActive } = req.body;
        const filePath = req.file?.path || undefined;
        const updatedPromo = await updatePromoService(Number(id), Number(discount), isActive === "true" || isActive === true, filePath);
        res.status(200).json({ success: true, message: "Promo successfully updated", data: updatedPromo });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function deletePromoController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { id } = req.params;
        const result = await deletePromoService(Number(id));
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        handlerAnyError(error, res);
    }
}
