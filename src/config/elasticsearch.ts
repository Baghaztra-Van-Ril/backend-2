import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: {
        apiKey: process.env.ELASTIC_API_KEY as string,
    },
    tls: {
        rejectUnauthorized: false,
    }
});

