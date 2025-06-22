import { Router } from "express";
import {
    addFavoriteController,
    removeFavoriteController,
    getFavoritesCountController
} from "../controllers/favorite.controller";

const favoriteRouter = Router();

favoriteRouter.post("/", addFavoriteController); 
favoriteRouter.delete("/", removeFavoriteController); 
favoriteRouter.get("/:productId/count", getFavoritesCountController);

export default favoriteRouter;
