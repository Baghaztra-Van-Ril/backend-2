import { Router } from "express";
import {
    addFavoriteController,
    removeFavoriteController,
    getFavoritesCountController,
    getAllFavoriteController
} from "../controllers/favorite.controller";
import { authenticate, authorize } from "../middlewares/auth";

const favoriteRouter = Router();

favoriteRouter.post("/", authenticate, authorize("USER"), addFavoriteController); 
favoriteRouter.delete("/", authenticate, authorize("USER"), removeFavoriteController); 
favoriteRouter.get("/:productId/count", authenticate, authorize("USER"), getFavoritesCountController);
favoriteRouter.get("/", authenticate, authorize("USER"), getAllFavoriteController);
favoriteRouter.get("/user", authenticate, authorize("USER"), getAllFavoriteController);

export default favoriteRouter;
