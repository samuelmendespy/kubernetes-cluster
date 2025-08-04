import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Url from '../src/models/Url';
import redis from '../src/services/redisService';
import { generateShortUrl, redirectToLongUrl } from '../src/controllers/urlController';

// Mock shortid to ensure consistent short codes for testing
jest.mock('shortid', () => ({
    generate: jest.fn(() => 'testcode')
}));

// Mock the redis service
jest.mock('../src/services/redisService', () => ({
    __esModule: true, // This is important for default exports
    default: {
        get: jest.fn(),
        set: jest.fn(),
        on: jest.fn(), // Mock the .on method to prevent connection issues during tests
        // Add any other methods your code calls on redis
    },
}));

// Create a mock Express app to test routes
const app = express();
app.use(express.json());
app.post('/generate', generateShortUrl);
app.get('/:shortCode', redirectToLongUrl);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    // Connect to a in-memory MongoDB instance for testing
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterEach(async () => {
    // Clear the database and reset mocks after each test
    await Url.deleteMany({});
    (redis.get as jest.Mock).mockClear();
    (redis.set as jest.Mock).mockClear();
    (jest.requireMock('shortid').generate as jest.Mock).mockClear();
});

afterAll(async () => {
    // Disconnect from MongoDB and stop the in-memory server
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('generateShortUrl', () => {
    const longUrl = 'https://www.example.com/very/long/url';
    const expectedShortCode = 'testcode'; // From mocked shortid

    test('should return 400 if longUrl is missing', async () => {
        const res = await request(app).post('/generate').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual({ error: 'longUrl is required' });
    });

    test('should return 400 if longUrl is invalid', async () => {
        const res = await request(app).post('/generate').send({ longUrl: 'invalid-url' });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual({ error: 'Invalid longUrl provided' });
    });

    test('should return 200 and existing short URL if longUrl already exists', async () => {
        // Pre-save an entry
        await Url.create({ longUrl, shortCode: expectedShortCode });

        const res = await request(app).post('/generate').send({ longUrl });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'URL already shortened');
        expect(res.body.shortUrl).toContain(expectedShortCode);
        expect(jest.requireMock('shortid').generate).not.toHaveBeenCalled(); // Should not generate new short code
        expect(redis.set).not.toHaveBeenCalled(); // Should not set in redis again
    });

    test('should generate a new short URL, save to DB, and cache in Redis if longUrl is new', async () => {
        const res = await request(app).post('/generate').send({ longUrl });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'URL shortened successfully');
        expect(res.body.shortUrl).toContain(expectedShortCode);

        // Verify it's saved in DB
        const savedUrl = await Url.findOne({ longUrl });
        expect(savedUrl).toBeDefined();
        expect(savedUrl?.shortCode).toEqual(expectedShortCode);

        // Verify it's cached in Redis
        expect(redis.set).toHaveBeenCalledWith(expectedShortCode, longUrl, 'EX', expect.any(Number));
        expect(jest.requireMock('shortid').generate).toHaveBeenCalled(); // Should generate new short code
    });

    test('should handle internal server error during generation', async () => {
        // Force an error by mocking Url.findOne to throw
        jest.spyOn(Url, 'findOne').mockImplementationOnce(() => {
            throw new Error('DB error');
        });

        const res = await request(app).post('/generate').send({ longUrl });
        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ error: 'Internal server error' });

        // Restore the original implementation
        jest.spyOn(Url, 'findOne').mockRestore();
    });
});

describe('redirectToLongUrl', () => {
    const longUrl = 'https://www.another-example.com/path';
    const shortCode = 'redirectcode';

    beforeEach(async () => {
        // Ensure shortid mock is set for this suite if needed, or reset it
        (jest.requireMock('shortid').generate as jest.Mock).mockReturnValue(shortCode);
    });

    test('should redirect if URL is found in Redis cache', async () => {
        (redis.get as jest.Mock).mockResolvedValueOnce(longUrl); // Mock Redis hit

        const res = await request(app).get(`/${shortCode}`);
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toEqual(longUrl);

        expect(redis.get).toHaveBeenCalledWith(shortCode);
        // Ensure DB update for clicks is attempted asynchronously
        // We can't directly await it, but we can check if updateOne was called
        jest.spyOn(Url, 'updateOne'); // Spy on updateOne
        // The actual updateOne call happens after the redirect, so we can't await it here.
        // For a more robust test, you might use a fake timer or a more complex mock.
        // For now, we'll just check if redis.set was not called (as it's a cache hit)
        expect(redis.set).not.toHaveBeenCalled();
    });

    test('should redirect if URL is found in MongoDB and cache it', async () => {
        (redis.get as jest.Mock).mockResolvedValueOnce(null); // Mock Redis miss
        await Url.create({ longUrl, shortCode, clicks: 0 }); // Pre-save in DB

        const res = await request(app).get(`/${shortCode}`);
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toEqual(longUrl);

        expect(redis.get).toHaveBeenCalledWith(shortCode);
        expect(redis.set).toHaveBeenCalledWith(shortCode, longUrl, 'EX', expect.any(Number));

        // Verify click count incremented in DB
        const updatedUrl = await Url.findOne({ shortCode });
        expect(updatedUrl?.clicks).toEqual(1);
    });

    test('should return 404 if short URL is not found in cache or DB', async () => {
        (redis.get as jest.Mock).mockResolvedValueOnce(null); // Mock Redis miss
        jest.spyOn(Url, 'findOne').mockResolvedValueOnce(null); // Mock DB miss

        const res = await request(app).get(`/${shortCode}`);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toEqual({ error: 'Short URL not found' });

        expect(redis.get).toHaveBeenCalledWith(shortCode);
        expect(Url.findOne).toHaveBeenCalledWith({ shortCode });
        expect(redis.set).not.toHaveBeenCalled(); // Should not cache
    });

    test('should handle internal server error during redirection', async () => {
        (redis.get as jest.Mock).mockResolvedValueOnce(null); // Mock Redis miss
        // Force an error by mocking Url.findOne to throw
        jest.spyOn(Url, 'findOne').mockImplementationOnce(() => {
            throw new Error('DB error during redirect');
        });

        const res = await request(app).get(`/${shortCode}`);
        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ error: 'Internal server error' });

        // Restore the original implementation
        jest.spyOn(Url, 'findOne').mockRestore();
    });
});
