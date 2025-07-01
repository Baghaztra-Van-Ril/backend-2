import { primaryPrisma } from "../config/prisma_primary";
import { replicaPrisma } from "../config/prisma_slave";
import { AppError } from "../errors/handle_error";
import cloudinary from "../config/cloudinary";
import { redis } from "../config/redis";
import fs from "fs";

export async function getAllPromosService() {
    try {
        const cacheKey = "all_promos";
        const cached: string | null = await redis.get(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                await redis.del(cacheKey);
            }
        }

        const promos = await replicaPrisma.promo.findMany({
            where: { isActive: true },
            include: { product: true },
        });

        await redis.set(cacheKey, JSON.stringify(promos), { ex: 3600 });
        return promos;
    } catch {
        console.error("Error fetching all promos from database");
        throw new AppError("Failed to fetch all promos", 500);
    }
}

export async function getActivePromosService() {
    try {
        const cacheKey = "active_promos";
        const cached: string | null = await redis.get(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                await redis.del(cacheKey);
            }
        }

        const promos = await replicaPrisma.promo.findMany({
            where: { isActive: true },
            include: { product: true },
        });

        await redis.set(cacheKey, JSON.stringify(promos), { ex: 3600 });
        return promos;
    } catch {
        throw new AppError("Failed to fetch active promos", 500);
    }
}

export async function getPromoByIdService(promoId: number) {
    try {
        const cacheKey = `promo_${promoId}`;
        const cached: string | null = await redis.get(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                await redis.del(cacheKey);
            }
        }

        const promo = await replicaPrisma.promo.findFirst({
            where: { id: promoId, isActive: true },
            include: { product: true },
        });

        if (!promo) throw new AppError("Promo not found", 404);

        await redis.set(cacheKey, JSON.stringify(promo), { ex: 3600 });
        return promo;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to fetch promo", 500);
    }
}

export async function createPromoService(productId: number, discount: number, filePath: string) {
    try {
        if (discount < 0 || discount > 1) {
            throw new AppError("Discount must be between 0 and 1", 400);
        }

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            folder: "UAS-Topik-Khusus-Promos",
        });
        fs.unlinkSync(filePath);

        const newPromo = await primaryPrisma.promo.create({
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

export async function updatePromoService(promoId: number, discount: number, isActive: boolean, filePath?: string) {
    try {
        if (discount < 0 || discount > 1) {
            throw new AppError("Discount must be between 0 and 1", 400);
        }

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

        const updatedPromo = await primaryPrisma.promo.update({
            where: { id: promoId },
            data,
        });

        await redis.del("all_promos");
        await redis.del("active_promos");
        await redis.del(`promo_${promoId}`);
        return updatedPromo;
    } catch (err) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw new AppError("Failed to update promo", 500);
    }
}

export async function deletePromoService(promoId: number) {
    try {
        const promo = await primaryPrisma.promo.findUnique({ where: { id: promoId } });
        if (!promo) throw new AppError("Promo not found", 404);

        if (promo.imageUrl && promo.imageUrl.includes("res.cloudinary.com")) {
            const matches = promo.imageUrl.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp)/i);
            const publicId = matches?.[1];

            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryErr) {
                    console.warn("Gagal hapus image dari Cloudinary (tidak fatal):", cloudinaryErr);
                }
            }
        }

        await primaryPrisma.promo.delete({ where: { id: promoId } });

        await redis.del(`promo_${promoId}`);
        await redis.del("all_promos");

        return { message: "Promo deleted successfully" };
    } catch (err) {
        console.error("Delete promo error:", err);
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to delete promo", 500);
    }
}
