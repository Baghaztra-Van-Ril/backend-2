import prisma from "../config/prisma";
import { AppError } from "../errors/handle_error";
import cloudinary from "../config/cloudinary";
import { redis } from "../config/redis";
import fs from "fs";

export async function getAllPromosService() {
    try {
        const cacheKey = "all_promos";
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const promos = await prisma.promo.findMany({
            include: {
                product: true,
            },
        });

        await redis.set(cacheKey, JSON.stringify(promos), 'EX', 60 * 60);
        return promos;
    } catch (err) {
        throw new AppError("Failed to fetch all promos", 500);
    }
}

export async function getActivePromosService() {
    try {
        const cacheKey = "active_promos";
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const activePromos = await prisma.promo.findMany({
            where: { isActive: true },
            include: { product: true },
        });

        await redis.set(cacheKey, JSON.stringify(activePromos), 'EX', 60 * 60);
        return activePromos;
    } catch (err) {
        throw new AppError("Failed to fetch active promos", 500);
    }
}


export async function getPromoByIdService(promoId: number) {
    try {
        const cacheKey = `promo_${promoId}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const promo = await prisma.promo.findUnique({
            where: { id: promoId },
            include: { product: true },
        });
        if (!promo) throw new AppError("Promo not found", 404);

        await redis.set(cacheKey, JSON.stringify(promo), 'EX', 60 * 60);
        return promo;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to fetch promo", 500);
    }
}

export async function createPromoService(productId: number, discount: number, filePath: string) {
    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            folder: "UAS-Topik-Khusus-Promos",
        });
        fs.unlinkSync(filePath);

        const newPromo = await prisma.promo.create({
            data: {
                productId,
                discount,
                imageUrl: uploadResult.secure_url,
                isActive: true,
            },
        });

        await redis.del("all_promos");
        return newPromo;
    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw new AppError("Failed to create promo", 500);
    }
}

export async function updatePromoService(promoId: number, discount: number, isActive: boolean, filePath?: string
) {
    try {
        let imageUrl = undefined;
        if (filePath) {
            const uploadResult = await cloudinary.uploader.upload(filePath, {
                folder: "UAS-Topik-Khusus-Promos",
            });
            fs.unlinkSync(filePath);
            imageUrl = uploadResult.secure_url;
        }

        const data: any = {
            discount,
            isActive,
        };
        if (imageUrl) data.imageUrl = imageUrl;

        const updatedPromo = await prisma.promo.update({
            where: { id: promoId },
            data,
        });

        await redis.del("all_promos");
        await redis.del("active_promos")
        await redis.del(`promo_${promoId}`);
        return updatedPromo;
    } catch (err) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw new AppError("Failed to update promo", 500);
    }
}

export async function deletePromoService(promoId: number) {
    try {
        const promo = await prisma.promo.findUnique({ where: { id: promoId } });
        if (!promo) throw new AppError("Promo not found", 404);

        if (promo.imageUrl) {
            const matches = promo.imageUrl.match(/\/v\d+\/(.+)\.(jpg|JPG|jpeg|JPEG|png|PNG)/);
            const publicId = matches?.[1];
            if (publicId) await cloudinary.uploader.destroy(publicId);
        }

        await prisma.promo.delete({ where: { id: promoId } });

        await redis.del("all_promos");
        await redis.del(`promo_${promoId}`);

        return { message: "Promo deleted successfully" };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to delete promo", 500);
    }
}
