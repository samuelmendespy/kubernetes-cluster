import { Router } from 'express';
import { Logger } from '../logging/logger';
import { CacheManager } from '../cache/index';
import { ElasticsearchClient } from '../elasticsearch/client';

const router = Router();
const logger = new Logger();
const cacheManager = new CacheManager();
const elasticsearchClient = new ElasticsearchClient();

export function setRoutes(app) {
    router.get('/health', (req, res) => {
        logger.logInfo('Health check endpoint hit');
        res.status(200).json({ status: 'OK' });
    });

    router.get('/data', async (req, res) => {
        const cacheKey = 'dataKey';
        const cachedData = cacheManager.getCache(cacheKey);

        if (cachedData) {
            logger.logInfo('Returning cached data');
            return res.json(cachedData);
        }

        try {
            const data = await elasticsearchClient.indexDocument({ /* document data */ });
            cacheManager.setCache(cacheKey, data);
            logger.logInfo('Data fetched from Elasticsearch and cached');
            res.json(data);
        } catch (error) {
            logger.logError('Error fetching data from Elasticsearch', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.use('/api', router);
}