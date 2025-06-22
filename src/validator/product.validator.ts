import { body, query } from "express-validator";

export const createProductValidator = [
    body("image").custom((_, { req }) => {
        if (!req.file) throw new Error("Product image is required.");
        const allowedMimeType = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedMimeType.includes(req.file.mimetype)) {
            throw new Error("Unsupported image format. Allowed: jpg, jpeg, png.");
        }
        return true;
    }),
    body("name")
        .notEmpty().withMessage("Product name is required."),
    body("description")
        .notEmpty().withMessage("Product description is required.")
        .isLength({ min: 5 }).withMessage("Description must be at least 5 characters."),
    body("price")
        .notEmpty().withMessage("Product price is required.")
        .isFloat({ gt: 0 }).withMessage("Price must be a number greater than 0."),
    body("size")
        .notEmpty().withMessage("Product size is required.")
        .isInt({ gt: 0 }).withMessage("Size must be an integer greater than 0."),
    body("stock")
        .notEmpty().withMessage("Product stock is required.")
        .isInt({ min: 0 }).withMessage("Stock must be an integer greater than or equal to 0.")
];

export const updateProductValidator = [
    body("image").optional().custom((_, { req }) => {
        if (!req.file) throw new Error("Product image is required.");
        const allowedMimeType = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedMimeType.includes(req.file.mimetype)) {
            throw new Error("Unsupported image format. Allowed: jpg, jpeg, png.");
        }
        return true;
    }),
    body("name")
        .optional()
        .notEmpty().withMessage("Product name is required."),
    body("description")
        .optional()
        .isLength({ min: 5 }).withMessage("Description must be at least 5 characters."),
    body("price")
        .optional()
        .isFloat({ gt: 0 }).withMessage("Price must be a number greater than 0."),
    body("size")
        .optional()
        .isInt({ gt: 0 }).withMessage("Size must be an integer greater than 0."),
    body("stock")
        .optional()
        .isInt({ min: 0 }).withMessage("Stock must be an integer greater than or equal to 0.")
];

export const searchProductValidator = [
    query("q")
        .notEmpty().withMessage("Search query is required.")
        .isString().withMessage("Search query must be a string.")
];
