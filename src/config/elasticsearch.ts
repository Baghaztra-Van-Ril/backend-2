import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';
dotenv.config();

export const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: {
        apiKey: process.env.ELASTIC_API_KEY as string,
    },
    tls: {
        rejectUnauthorized: false,
    }
});

