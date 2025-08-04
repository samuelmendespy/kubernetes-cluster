import mongoose, { Schema, Document } from 'mongoose';

// Define an interface for the URL document
export interface IUrl extends Document {
    shortCode: string;
    longUrl: string;
    createdAt: Date;
    clicks: number;
}

// Define the Mongoose schema
const urlSchema: Schema = new Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    longUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    clicks: {
        type: Number,
        default: 0
    }
});

// Create and export the Mongoose model
const Url = mongoose.model<IUrl>('Url', urlSchema);

export default Url;