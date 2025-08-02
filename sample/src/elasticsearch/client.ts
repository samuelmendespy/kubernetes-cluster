import { Client } from '@elastic/elasticsearch';

export class ElasticsearchClient {
    private client: Client;

    constructor(node: string) {
        this.client = new Client({ node });
    }

    async connect() {
        try {
            await this.client.ping();
            console.log('Elasticsearch cluster is reachable');
        } catch (error) {
            console.error('Elasticsearch cluster is not reachable', error);
            throw error;
        }
    }

    async indexDocument(index: string, id: string, document: object) {
        try {
            const response = await this.client.index({
                index,
                id,
                body: document,
            });
            return response;
        } catch (error) {
            console.error('Error indexing document', error);
            throw error;
        }
    }
}