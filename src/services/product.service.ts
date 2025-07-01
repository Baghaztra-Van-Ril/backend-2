import { primaryPrisma } from "../config/prisma_primary";
import { replicaPrisma } from "../config/prisma_slave";
import { AppError } from "../errors/handle_error";
import cloudinary from "../config/cloudinary";
import { esClient } from "../config/elasticsearch";
import { redis } from "../config/redis";
import fs from "fs";
import path from "path";

export async function getAllProductsService() {
    try {
        const cacheKey = "all_products";
        const cachedProducts = await redis.get(cacheKey);
        if (typeof cachedProducts === "string") return JSON.parse(cachedProducts);

        const products = await replicaPrisma.product.findMany({
            where: {
                isDeleted: false // Hanya ambil produk yang belum dihapus
            },
            include: {
                _count: {
                    select: {
                        favorites: true,
                        transactions: true
                    }
                }
            }
        });

        // Cache the products for 1 hour
        await redis.set(cacheKey, JSON.stringify(products), { ex: 60 * 60 });
        return products;
    } catch (err) {
        throw new AppError("Failed to get all products", 500);
    }
}

export async function getProductByIdService(productId: number, userRole?: string) {
    try {
        const cacheKey = `product_${productId}`;
        const cached = await redis.get(cacheKey);
        let product;

        if (typeof cached === "string") {
            product = JSON.parse(cached);
        } else {
            product = await replicaPrisma.product.findFirst({ where: { id: productId, isDeleted: false } });
            if (!product) throw new AppError("Product not found", 404);
            // redis cache the product for 1 hour
            await redis.set(cacheKey, JSON.stringify(product), { ex: 60 * 60 });
        }

        // Hanya increment visit count jika bukan ADMIN
        const isAdmin = userRole === "ADMIN";
        if (!isAdmin) {
            await visitProductService(productId);
        }

        // Ambil data promo yang terkait dengan produk ini
        const promo = await replicaPrisma.promo.findMany({
            where: { productId: productId }
        });
        product = { ...product, promo };
        return product;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to get product by ID", 500);
    }
}

export async function visitProductService(productId: number) {
    const lockKey = `lock_visit_${productId}`;
    const alreadyVisited = await redis.get(lockKey);

    if (alreadyVisited) {
        return;
    }

    // Set a lock to prevent concurrent visits (1 detik)
    await redis.set(lockKey, "1", { ex: 1 });

    await primaryPrisma.product.update({
        where: { id: productId },
        data: { visitCount: { increment: 1 } },
    });

    // Hapus cache produk setelah update visit count
    await redis.del(`product_${productId}`);
}

export async function searchProductService(query: string) {
    try {
        const result = await esClient.search({
            index: "uas-topik-khusus-products",
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                isDeleted: false, //  Filter produk yang belum dihapus
                            },
                        },
                    ],
                    should: [
                        {
                            wildcard: {
                                name: {
                                    value: `*${query.toLowerCase()}*`,
                                    case_insensitive: true,
                                },
                            },
                        },
                        {
                            wildcard: {
                                description: {
                                    value: `*${query.toLowerCase()}*`,
                                    case_insensitive: true,
                                },
                            },
                        },
                    ],
                    minimum_should_match: 1, // setidaknya 1 dari `should` cocok
                },
            },
        });

        return result.hits.hits.map((hit: any) => ({
            id: hit._id,
            name: hit._source.name,
            description: hit._source.description,
            price: hit._source.price,
            size: hit._source.size,
            stock: hit._source.stock,
            imageUrl: hit._source.imageUrl,
            createdAt: hit._source.createdAt,
            updatedAt: hit._source.updatedAt,
        }));
    } catch (err) {
        console.error("Elasticsearch search error:", (err as any)?.meta?.body || err);
        throw new AppError("Search failed", 500);
    }
}

export async function createProductService(
    name: string,
    description: string,
    price: number,
    size: number,
    stock: number,
    filePath: string
) {
    const fullPath = path.resolve(filePath);

    try {
        if (price < 0 || size <= 0 || stock < 0) {
            throw new AppError("Invalid product data: price, size, or stock", 400);
        }

        const uploadResult = await cloudinary.uploader.upload(fullPath, {
            folder: "UAS-Topik-Khusus-Products",
        });

        fs.unlinkSync(fullPath);

        const newProduct = await primaryPrisma.product.create({
            data: {
                name,
                description,
                price,
                size,
                stock,
                imageUrl: uploadResult.secure_url,
            },
        });

        await esClient.index({
            index: "uas-topik-khusus-products",
            id: newProduct.id.toString(),
            document: {
                name: newProduct.name,
                description: newProduct.description,
                price: newProduct.price,
                size: newProduct.size,
                stock: newProduct.stock,
                imageUrl: newProduct.imageUrl,
                createdAt: newProduct.createdAt,
                updatedAt: newProduct.updatedAt,
            },
        });

        await redis.del("all_products");

        return newProduct;
    } catch (err) {
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        throw new AppError("Failed to create product", 500);
    }
}

export async function updateProductService(
    name: string,
    description: string,
    price: number,
    size: number,
    stock: number,
    filePath: string,
    productId: number
) {
    const fullPath = filePath ? path.resolve(filePath) : null;

    try {
        let imageUrl = null;

        if (fullPath) {
            const uploadResult = await cloudinary.uploader.upload(fullPath, {
                folder: "UAS-Topik-Khusus-Products"
            });
            fs.unlinkSync(fullPath);
            imageUrl = uploadResult.secure_url;
        }

        const updateProduct: any = { name, description, price, size, stock };
        if (imageUrl !== null) {
            updateProduct.imageUrl = imageUrl;
        }

        const updatedProduct = await primaryPrisma.product.update({
            where: { id: productId },
            data: updateProduct,
        });

        await esClient.index({
            index: "uas-topik-khusus-products",
            id: updatedProduct.id.toString(),
            document: {
                name: updatedProduct.name,
                description: updatedProduct.description,
                price: updatedProduct.price,
                size: updatedProduct.size,
                stock: updatedProduct.stock,
                imageUrl: updatedProduct.imageUrl,
                createdAt: updatedProduct.createdAt,
                updatedAt: updatedProduct.updatedAt,
            },
        });

        return updatedProduct;
    } catch (err) {
        if (fullPath && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        throw new AppError("Failed to update product", 500);
    }
}

export async function deleteProductService(productId: number) {
    try {
        const product = await primaryPrisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError("Product not found", 404);
        if (product.isDeleted) throw new AppError("Product already deleted", 400);

        if (product.imageUrl && product.imageUrl.includes("res.cloudinary.com")) {
            const matches = product.imageUrl.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp)/i);
            const publicId = matches?.[1];

            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryErr) {
                    console.warn("Gagal hapus image dari Cloudinary (tidak fatal):", cloudinaryErr);
                }
            }
        }

        await esClient.delete({ index: "uas-topik-khusus-products", id: productId.toString() }).catch(() => { });
        await redis.del(`product_${productId}`);
        await redis.del("all_products");

        await primaryPrisma.product.update({
            where: { id: productId },
            data: { isDeleted: true },
        });

        return { message: "Product deleted successfully" };
    } catch (err) {
        console.error("Delete product error:", err);
        throw new AppError("Failed to delete product", 500);
    }
}
