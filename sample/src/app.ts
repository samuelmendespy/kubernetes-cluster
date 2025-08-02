import express from 'express';
import { CacheManager } from './cache';
import { Logger } from './logging/logger';
import { ElasticsearchClient } from './elasticsearch/client';
import { setRoutes } from './routes';

const app = express();
const port = process.env.PORT || 3000;

const cacheManager = new CacheManager();
const logger = new Logger();
const elasticsearchClient = new ElasticsearchClient();

app.use(express.json());

setRoutes(app, logger, cacheManager, elasticsearchClient);

app.listen(port, () => {
    logger.logInfo(`Server is running on http://localhost:${port}`);
});