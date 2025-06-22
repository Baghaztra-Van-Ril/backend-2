import { body } from "express-validator";
import prisma from "../config/prisma";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

export const createPromoValidator = [
    body("productId")
        .notEmpty().withMessage("Product ID is required")
        .bail()
        .isInt({ min: 1 }).withMessage("Product ID must be a valid integer")
        .bail()
        .custom(async (id) => {
            const product = await prisma.product.findUnique({ where: { id: Number(id) } });
            if (!product) throw new Error("Product not found");
            return true;
        }),

    body("discount")
        .notEmpty().withMessage("Discount is required")
        .bail()
        .isInt({ min: 0, max: 100 }).withMessage("Discount must be between 0 and 100"),

    body("image")
        .custom((_, { req }) => {
            if (!req.file) throw new Error("Promo image is required");
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                throw new Error("Invalid image format (allowed: jpeg, png, jpg)");
            }
            return true;
        })
];

export const updatePromoValidator = [
    body("productId")
        .optional()
        .isInt({ min: 1 }).withMessage("Product ID must be a valid integer")
        .bail()
        .custom(async (id) => {
            const product = await prisma.product.findUnique({ where: { id: Number(id) } });
            if (!product) throw new Error("Product not found");
            return true;
        }),

    body("discount")
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage("Discount must be between 0 and 100"),

    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean"),

    body("image")
        .optional()
        .custom((_, { req }) => {
            if (!req.file) return true;
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                throw new Error("Invalid image format (allowed: jpeg, png, jpg)");
            }
            return true;
        })
];
