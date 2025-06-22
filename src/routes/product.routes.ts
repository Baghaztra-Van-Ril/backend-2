import { Router } from "express";
import {
    createProductController,
    updateProductController,
    deleteProductController,
    getAllProductController,
    getProductByIdController,
    searchProductController,
} from '../controllers/product.controller';
import { createProductValidator, updateProductValidator, searchProductValidator } from "../validator/product.validator";
import { handleValidationErrors } from "../middlewares/handle_validation_errors";
import upload from "../middlewares/upload";

const productRouter = Router();

productRouter.get("/search", searchProductValidator, handleValidationErrors ,searchProductController);
productRouter.get("/", getAllProductController);
productRouter.get("/:id", getProductByIdController);
productRouter.post("/", upload.single("image"), createProductValidator, handleValidationErrors, createProductController);
productRouter.put("/:id", upload.single("image"), updateProductValidator, handleValidationErrors, updateProductController);
productRouter.delete("/:id", deleteProductController );

export default productRouter;