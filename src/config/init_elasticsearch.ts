import { esClient } from "./elasticsearch";

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
                    createdAt: { type: "date" },
                    updatedAt: { type: "date" },
                },
            },
        });
        console.log(`Index '${indexName}' created.`);
    } else {
        console.log(`Index '${indexName}' already exists.`);
    }
}

initIndex().catch(console.error);
