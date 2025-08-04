import { Request, Response } from 'express';
import shortid from 'shortid';
import Url, { IUrl } from '../models/Url';
import { isValidUrl } from '../utils/validation';
import redis from '../services/redisService';

const CACHE_EXPIRY_SECONDS = 60 * 60 * 24;

export const generateShortUrl = async (req: Request, res: Response) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        return res.status(400).json({ error: 'longUrl is required' });
    }

    if (!isValidUrl(longUrl)) {
        return res.status(400).json({ error: 'Invalid longUrl provided' });
    }

    try {
        let existingUrl: IUrl | null = await Url.findOne({ longUrl });
        if (existingUrl) {
            return res.status(200).json({
                message: 'URL already shortened',
                shortUrl: `${req.protocol}://${req.get('host')}/${existingUrl.shortCode}`
            });
        }

        let shortCode: string;
        let isUnique: boolean = false;
        do {
            shortCode = shortid.generate();
            const existingShortCode = await Url.findOne({ shortCode });
            if (!existingShortCode) {
                isUnique = true;
            }
        } while (!isUnique);

        const newUrl: IUrl = new Url({
            longUrl,
            shortCode
        });

        await newUrl.save();
        await redis.set(shortCode, longUrl, 'EX', CACHE_EXPIRY_SECONDS);

        res.status(201).json({
            message: 'URL shortened successfully',
            shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`
        });

    } catch (err: any) {
        console.error('Error shortening URL:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const redirectToLongUrl = async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    try {
        let longUrl: string | null = await redis.get(shortCode);

        if (longUrl) {
            Url.updateOne({ shortCode }, { $inc: { clicks: 1 } })
                .exec()
                .catch((err: Error) => console.error('Error incrementing click count in MongoDB:', err));
            
            return res.redirect(302, longUrl);
        }

        const urlEntry: IUrl | null = await Url.findOne({ shortCode });

        if (urlEntry) {
            longUrl = urlEntry.longUrl;
            await redis.set(shortCode, longUrl, 'EX', CACHE_EXPIRY_SECONDS);

            urlEntry.clicks++;
            await urlEntry.save();
            
            return res.redirect(302, longUrl);
        } else {
            return res.status(404).json({ error: 'Short URL not found' });
        }

    } catch (err: any) {
        console.error('Error redirecting:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};