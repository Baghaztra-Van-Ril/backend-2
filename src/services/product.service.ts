import prisma from "../config/prisma";
import { AppError } from "../errors/handle_error";
import cloudinary from "../config/cloudinary";
import { esClient } from "../config/elasticsearch";
import { redis } from "../config/redis";
import fs from "fs";

export async function getAllProductsService() {
    try {
        const cacheKey = "all_products";
        const cachedProducts = await redis.get(cacheKey);
        if (cachedProducts) return JSON.parse(cachedProducts);

        const products = await prisma.product.findMany({
            include: {
                _count: {
                    select: {
                        favorites: true
                    }
                }
            }
        });

        await redis.set(cacheKey, JSON.stringify(products), 'EX', 60 * 60);
        return products;
    } catch (err) {
        throw new AppError("Failed to get all products", 500);
    }
}

export async function getProductByIdService(productId: number) {
    try {
        const cacheKey = `product_${productId}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError("Product not found", 404);

        await redis.set(cacheKey, JSON.stringify(product), 'EX', 60 * 60);
        return product;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to get product by ID", 500);
    }
}

export async function visitProductService(productId: number) {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: { visitCount: { increment: 1 } },
        });
        await redis.del(`product_${productId}`);
    } catch (err) {
        throw new AppError("Failed to increment visit count", 500);
    }
}

export async function searchProductService(query: string) {
    try {
        const result = await esClient.search({
            index: "products",
            query: {
                multi_match: {
                    query: query,
                    fields: ["name", "description"],
                    fuzziness: "AUTO",
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
            updatedAt: hit._source.updatedAt
        }));
    } catch (err) {
        throw new AppError("Search failed", 500);
    }
}

export async function createdProductService(
    name: string,
    description: string,
    price: number,
    size: number,
    stock: number,
    filePath: string
) {
    try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            folder: "UAS-Topik-Khusus-Products"
        });
        fs.unlinkSync(filePath);

        const newProduct = await prisma.product.create({
            data: { name, description, price, size, stock, imageUrl: uploadResult.secure_url },
        });
        await esClient.index({
            index: "products",
            id: newProduct.id.toString(),
            document: {
                name: newProduct.name,
                description: newProduct.description,
                price: newProduct.price,
                size: newProduct.size,
                stock: newProduct.stock,
                imageUrl: newProduct.imageUrl,
                createdAt: newProduct.createdAt,
                updatedAt: newProduct.updatedAt
            },
        });
        await redis.del("all_products");
        return newProduct;
    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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
    try {
        let imageUrl = null;

        if (filePath) {
            const uploadResult = await cloudinary.uploader.upload(filePath, {
                folder: "UAS-Topik-Khusus-Products"
            });
            fs.unlinkSync(filePath);
            imageUrl = uploadResult.secure_url;
        }

        const updateProduct: any = { name, description, price, size, stock };
        if (imageUrl !== null) {
            updateProduct.imageUrl = imageUrl;
        }
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: updateProduct,
        });

        await esClient.index({
            index: "products",
            id: updatedProduct.id.toString(),
            document: {
                name: updatedProduct.name,
                description: updatedProduct.description,
                price: updatedProduct.price,
                size: updatedProduct.size,
                stock: updatedProduct.stock,
                imageUrl: updatedProduct.imageUrl,
                createdAt: updatedProduct.createdAt,
                updatedAt: updatedProduct.updatedAt
            },
        });
        return updatedProduct;
    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw new AppError("Failed to update product", 500);
    }
}

export async function deleteProductService(productId: number) {
    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError("Product not found", 404);

        if (product.imageUrl) {
            const matches = product.imageUrl.match(/\/v\d+\/(.+)\.(jpg|JPG|jpeg|JPEG|png|PNG)/);
            const publicId = matches?.[1];
            if (publicId) await cloudinary.uploader.destroy(publicId);
        }

        await esClient.delete({ index: "products", id: productId.toString() });

        await redis.del(`product_${productId}`);
        await redis.del("all_products");
        await prisma.product.delete({ where: { id: productId } });
        return { message: "Product deleted successfully" };
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Failed to delete product", 500);
    }
}
