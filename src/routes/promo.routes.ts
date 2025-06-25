import { Router } from "express";
import {
    createPromoController,
    updatePromoController,
    getActivePromoController,
    deletePromoController,
    getAllPromoController,
    getPromoByIdController,
} from "../controllers/promo.controller";
import upload from "../middlewares/upload";
import { createPromoValidator, updatePromoValidator } from "../validator/promo.validator";
import { handleValidationErrors } from "../middlewares/handle_validation_errors";
import { authenticate, authorize } from "../middlewares/auth";

const promoRouter = Router();

promoRouter.get("/", getAllPromoController);
promoRouter.get("/active", getActivePromoController);
promoRouter.get("/:id", getPromoByIdController);
promoRouter.post("/", authenticate, authorize("ADMIN"), upload.single("image"), createPromoValidator, handleValidationErrors, createPromoController);
promoRouter.put("/:id", authenticate, authorize("ADMIN"), upload.single("image"), updatePromoValidator, handleValidationErrors, updatePromoController);
promoRouter.delete("/:id", authenticate, authorize("ADMIN"), deletePromoController);

export default promoRouter;
