import { primaryPrisma } from "../config/prisma_primary";
import { replicaPrisma } from "../config/prisma_slave";
import { AppError } from "../errors/handle_error";

export async function toggleFavoriteService(userId: number, productId: number) {
    return await primaryPrisma.$transaction(async (tx) => {
        const product = await tx.product.findFirst({
            where: {
                id: productId,
                isDeleted: false,
            },
        });
        if (!product) {
            throw new AppError("Product not found or has been deleted", 404);
        }

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
        const product = await replicaPrisma.product.findFirst({
            where: {
                id: productId,
                isDeleted: false,
            },
        });
        if (!product) throw new AppError("Product not found or has been deleted", 404);

        const count = await replicaPrisma.favorite.count({
            where: { productId },
        });

        return { favoritesCount: count };
    } catch (err) {
        throw new AppError("Failed to get favorite count", 500);
    }
}

export async function getAllFavoriteService(userId: number) {

    try {
        const favorites = await replicaPrisma.favorite.findMany({
            where: {
                userId,
                product: {
                    isDeleted: false,
                },
            },
            include: {
                product: true,
            },
        });

        return favorites;
    } catch (err) {
        throw new AppError("Failed to get all favorites", 500);
    }
}
