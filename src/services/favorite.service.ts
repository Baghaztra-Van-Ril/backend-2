import prisma from "../config/prisma";
import { AppError } from "../errors/handle_error";

export async function toggleFavoriteService(userId: number, productId: number) {
    return await prisma.$transaction(async (tx) => {
        const existing = await tx.favorite.findFirst({
            where: { userId, productId },
        });

        if (existing) {
            await tx.favorite.delete({ where: { id: existing.id } });
            return {
                favorited: false,
                message: "Product has been unfavorited",
            };
        } else {
            const favorite = await tx.favorite.create({
                data: { userId, productId },
            });
            return {
                favorited: true,
                message: "Product has been favorited",
                data: favorite,
            };
        }
    });
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

export async function getAllFavoriteService() {
    try {
        const favorites = await prisma.favorite.findMany({
            include: {
                product: true,
            }
        });
        return favorites;
    } catch (err) {
        throw new AppError("Failed to get all favorites", 500);
    }
}
