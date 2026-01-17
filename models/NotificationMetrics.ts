/**
 * Notification Metrics Model
 * Tracks push notification delivery statistics
 */

import mongoose from "mongoose";

export interface INotificationMetrics {
    _id?: mongoose.Types.ObjectId;
    date: Date;
    type: 'new_order' | 'order_reassigned' | 'status_change' | 'test' | 'other';
    sent: number;
    successful: number;
    failed: number;
    errors: Array<{
        message: string;
        count: number;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

const NotificationMetricsSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['new_order', 'order_reassigned', 'status_change', 'test', 'other'],
            index: true,
        },
        sent: {
            type: Number,
            default: 0,
            min: 0,
        },
        successful: {
            type: Number,
            default: 0,
            min: 0,
        },
        failed: {
            type: Number,
            default: 0,
            min: 0,
        },
        errors: [
            {
                message: {
                    type: String,
                    required: true,
                },
                count: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
NotificationMetricsSchema.index({ date: -1, type: 1 });

const NotificationMetricsModel =
    mongoose.models?.NotificationMetrics ||
    mongoose.model<INotificationMetrics>("NotificationMetrics", NotificationMetricsSchema);

export default NotificationMetricsModel;
