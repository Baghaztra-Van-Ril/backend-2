import { esClient } from "./elasticsearch";
import { primaryPrisma } from "./prisma_primary";

export async function initIndex() {
    const indexName = "uas-topik-khusus-products";

    const exists = await esClient.indices.exists({ index: indexName });

    if (!exists) {
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

        console.log(`Index '${indexName}' created.`);

        const products = await primaryPrisma.product.findMany();

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

        if (body.length > 0) {
            const result = await esClient.bulk({ refresh: true, body });
            console.log(`Indexed ${products.length} products to '${indexName}'.`);
            if (result.errors) {
                console.error("Some documents failed to index:", result.items);
            }
        }
    } else {
        console.log(`Index '${indexName}' already exists.`);
    }
}

initIndex().catch(console.error);
