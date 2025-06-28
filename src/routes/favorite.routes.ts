import { Router } from "express";
import {
    toggleFavoriteController,
    getFavoritesCountController,
    getAllFavoriteController,
} from "../controllers/favorite.controller";
import { authenticate, authorize } from "../middlewares/auth";

const favoriteRouter = Router();

favoriteRouter.post("/", authenticate, authorize("USER"), toggleFavoriteController); 
favoriteRouter.get("/:productId/count", authenticate, authorize("USER"), getFavoritesCountController);
favoriteRouter.get("/", authenticate, authorize("USER"), getAllFavoriteController);

export default favoriteRouter;
