import mongoose, { Schema } from 'mongoose';

export interface IShareToken extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ShareTokenSchema = new Schema<IShareToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IShareToken>('ShareToken', ShareTokenSchema);