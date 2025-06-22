import { esClient } from "./elasticsearch";

async function initIndex() {
    const exists = await esClient.indices.exists({ index: "products" });

    if (!exists) {
        await esClient.indices.create({
            index: "products",
            mappings: {
            properties: {
                id: { type: "integer" },
                name: { type: "text" },
                description: { type: "text" },
                price: { type: "integer" },
                imageUrl: { type: "keyword" },
                size: { type: "integer" },
                stock: { type: "integer" },
                visitCount: { type: "integer" },
                createdAt: { type: "date" },
                updatedAt: { type: "date" }
            },
            },
        });
        console.log("Index 'products' created.");
    } else {
        console.log("Index 'products' already exists.");
    }
}

initIndex().catch(console.error);
