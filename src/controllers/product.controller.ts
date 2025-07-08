import { Request, Response, NextFunction } from "express";
import { ResponseApiType } from "../types/api_types";
import { handlerAnyError } from "../errors/handle_error";
import {
    getAllProductsService,
    getProductByIdService,
    createProductService,
    updateProductService,
    deleteProductService,
    searchProductService
} from "../services/product.service";

export async function getAllProductController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const products = await getAllProductsService();
        res.setHeader("Cache-Control", "no-store");
        res.status(200).json({ success: true, message: "Fetched all products successfully", data: products });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function getProductByIdController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { id } = req.params;
        
        const userId = req.user?.id;
        const userRole = req.user?.role;

        const product = await getProductByIdService(Number(id), userId, userRole);
        res.setHeader("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: `Fetched product with id: ${id}`,
            data: product,
        });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function createProductController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { name, description, price, size, stock } = req.body;
        const filePath = req.file?.path;
        if (!filePath) throw new Error("Image file is required");

        const newProduct = await createProductService(
            name,
            description,
            Number(price),
            Number(size),
            Number(stock),
            filePath
        );

        res.status(201).json({
            success: true,
            message: `Product successfully added: ${newProduct.name}`,
            data: newProduct,
        });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function updateProductController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { id } = req.params;
        const { name, description, price, size, stock } = req.body;
        const filePath = req.file?.path;
        const updatedProduct = await updateProductService(name, description, Number(price), Number(size), Number(stock), filePath!, Number(id));
        res.status(200).json({ success: true, message: `Update product success: ${updatedProduct.name}`, data: updatedProduct });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function deleteProductController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { id } = req.params;
        const result = await deleteProductService(Number(id));
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        handlerAnyError(error, res);
    }
}

export async function searchProductController(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') throw new Error("Query parameter 'q' is required and must be a string");
        const products = await searchProductService(q);
        res.setHeader("Cache-Control", "no-store");
        res.status(200).json({ success: true, message: "Search products success", data: products });
    } catch (error) {
        handlerAnyError(error, res);
    }
}
