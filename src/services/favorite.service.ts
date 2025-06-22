import prisma from "../config/prisma";
import { AppError } from "../errors/handle_error";

export async function addFavoriteService(userId: number, productId: number) {
    try {
        const existing = await prisma.favorite.findFirst({
            where: { userId, productId },
        });
        if (existing) throw new AppError("Already favorited", 400);

        const favorite = await prisma.favorite.create({
            data: { userId, productId },
        });
        return favorite;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to add favorite", 500);
    }
}


export async function removeFavoriteService(userId: number, productId: number) {
    try {
        const favorite = await prisma.favorite.findFirst({
            where: { userId, productId },
        });
        if (!favorite) throw new AppError("Favorite not found", 404);

        await prisma.favorite.delete({ where: { id: favorite.id } });
        return { message: "Favorite removed" };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to remove favorite", 500);
    }
}

export async function getFavoritesCountService(productId: number) {
    try {
        const count = await prisma.favorite.count({
            where: { productId },
        });
        return { favoritesCount: count };
    } catch (err) {
        throw new AppError("Failed to get favorite count", 500);
    }
}
