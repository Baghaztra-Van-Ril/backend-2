import { esClient } from "./elasticsearch";
import { primaryPrisma } from "./prisma_primary";

export async function initIndex() {
    const indexName = "uas-topik-khusus-products";

    try {
        const exists = await esClient.indices.exists({ index: indexName });

        if (!exists) {
            console.log(`Index '${indexName}' belum ada. Membuat index...`);
            await esClient.indices.create({
                index: indexName,
                settings: {
                    analysis: {
                        analyzer: {
                            autocomplete_analyzer: {
                                type: "custom",
                                tokenizer: "autocomplete_tokenizer",
                                filter: ["lowercase"],
                            },
                        },
                        tokenizer: {
                            autocomplete_tokenizer: {
                                type: "edge_ngram",
                                min_gram: 1,
                                max_gram: 20,
                                token_chars: ["letter", "digit"],
                            },
                        },
                    },
                },
                mappings: {
                    properties: {
                        name: {
                            type: "text",
                            analyzer: "autocomplete_analyzer",
                            search_analyzer: "standard",
                        },
                        description: {
                            type: "text",
                            analyzer: "autocomplete_analyzer",
                            search_analyzer: "standard",
                        },
                        price: { type: "integer" },
                        size: { type: "integer" },
                        stock: { type: "integer" },
                        imageUrl: { type: "keyword" },
                        isDeleted: { type: "boolean" },
                        createdAt: { type: "date" },
                        updatedAt: { type: "date" },
                    },
                },
            });

            console.log(`Index '${indexName}' berhasil dibuat.`);

            const products = await primaryPrisma.product.findMany();
            console.log(`Total produk dari database: ${products.length}`);

            if (products.length === 0) {
                console.warn("Tidak ada produk yang ditemukan di database.");
                return;
            }

            const body = products.flatMap((product) => [
                { index: { _index: indexName, _id: product.id.toString() } },
                {
                    name: product.name,
                    description: product.description ?? "",
                    price: product.price,
                    size: product.size,
                    stock: product.stock,
                    imageUrl: product.imageUrl ?? "",
                    isDeleted: product.isDeleted,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                },
            ]);

            const result = await esClient.bulk({ refresh: true, body });

            console.log(`Indexed ${products.length} products to '${indexName}'.`);

            if (result.errors) {
                const erroredDocuments = result.items.filter((item: any) => item.index?.error);
                console.error("Beberapa dokumen gagal diindeks:");
                erroredDocuments.forEach((doc: any, index: number) => {
                    console.error(`❌ Error pada dokumen ke-${index + 1}:`, doc.index.error);
                });
            } else {
                console.log("✅ Semua produk berhasil diindeks.");
            }
        } else {
            console.log(`Index '${indexName}' sudah ada. Tidak perlu membuat ulang.`);
        }
    } catch (err) {
        console.error("Gagal inisialisasi index:", err);
    }
}

initIndex().catch((err) => console.error("Fatal error in initIndex:", err));
