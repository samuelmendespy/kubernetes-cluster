import 'dotenv/config';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import urlRoutes from './routes/urlRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Load the Swagger YAML file
const swaggerDocument = YAML.load(path.resolve(__dirname, '../../docs/swagger.yaml'));

// Middleware
app.use(express.json());
app.use('/v3/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Base route
app.get('/', (req: Request, res: Response) => {
    res.send('URL Shortener API is running! Access API docs at /v3/api-docs');
});

// Connect to MongoDB
const mongoUri: string | undefined = process.env.MONGO_URI;
if (!mongoUri) {
    console.error('MONGO_URI environment variable is not set. Please set it in your .env file.');
    process.exit(1);
}
mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err: Error) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Mount the router
app.use('/', urlRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`URL Shortener API listening on port ${PORT}`);
});

export default app;