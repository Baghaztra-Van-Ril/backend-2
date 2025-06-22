import { Router } from "express";
import { TestController } from "../controllers/test.controller";
import productRouter from "./product.routes";
import promoRouter from "./promo.routes";
import favoriteRouter from "./favorite.routes";

const apiRouter = Router();

apiRouter.get("/test", async (req, res, next) => {
    try {
        await TestController(req, res);
    } catch (error) {
        next(error);
    }
});

apiRouter.use("/products", productRouter);
apiRouter.use("/promos", promoRouter);
apiRouter.use("/favorites", favoriteRouter)


export default apiRouter;