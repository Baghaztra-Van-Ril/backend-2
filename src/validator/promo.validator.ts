import { body } from "express-validator";
import { primaryPrisma } from "../config/prisma_primary";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

export const createPromoValidator = [
    body("productId")
        .notEmpty().withMessage("Product ID is required")
        .bail()
        .isInt({ min: 1 }).withMessage("Product ID must be a valid integer")
        .bail()
        .custom(async (id) => {
            const product = await primaryPrisma.product.findFirst({
                where: { id: Number(id), isDeleted: false },
            });
            if (!product) throw new Error("Product not found or has been deleted");
            return true;
        }),

    body("discount")
        .notEmpty().withMessage("Discount is required")
        .bail()
        .isDecimal().withMessage("Discount must be a decimal number")
        .bail()
        .custom((value) => {
            const num = parseFloat(value);
            if (num < 0 || num > 1) {
                throw new Error("Discount must be between 0 and 1");
            }
            return true;
        }),

    body("image")
        .custom((_, { req }) => {
            if (!req.file) throw new Error("Promo image is required");
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                throw new Error("Invalid image format (allowed: jpeg, png, jpg)");
            }
            return true;
        }),
];

export const updatePromoValidator = [
    body("productId")
        .optional()
        .isInt({ min: 1 }).withMessage("Product ID must be a valid integer")
        .bail()
        .custom(async (id) => {
            const product = await primaryPrisma.product.findFirst({
                where: { id: Number(id), isDeleted: false },
            });
            if (!product) throw new Error("Product not found or has been deleted");
            return true;
        }),

    body("discount")
        .optional()
        .isDecimal().withMessage("Discount must be a decimal number")
        .bail()
        .custom((value) => {
            const num = parseFloat(value);
            if (num < 0 || num > 1) {
                throw new Error("Discount must be between 0 and 1");
            }
            return true;
        }),

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
        }),
];
