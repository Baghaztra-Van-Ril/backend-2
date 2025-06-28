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
import { authenticate, authorize } from "../middlewares/auth";

const productRouter = Router();

productRouter.get("/search", searchProductValidator, handleValidationErrors ,searchProductController);
productRouter.get("/", getAllProductController);
productRouter.get("/:id", authenticate, getProductByIdController);
productRouter.post("/", authenticate, authorize("ADMIN"), upload.single("image"), createProductValidator, handleValidationErrors, createProductController);
productRouter.put("/:id", authenticate, authorize("ADMIN"), upload.single("image"), updateProductValidator, handleValidationErrors, updateProductController);
productRouter.delete("/:id", authenticate, authorize("ADMIN"), deleteProductController );

export default productRouter;   