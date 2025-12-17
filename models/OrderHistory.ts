// models/OrderHistory.ts

import mongoose from "mongoose";

const OrderHistorySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    changeType: {
      type: String,
      enum: [
        "status_change",
        "crew_assignment",
        "materials_added",
        "completed",
        "cancelled",
        "created",
        "updated"
      ],
      required: true,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    description: {
      type: String,
      required: true,
    },
    // For filtering by crew in reports
    crew: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
    },
    // Optional: track who made the change (for future user authentication)
    changedBy: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const OrderHistoryModel =
  mongoose.models?.OrderHistory ||
  mongoose.model("OrderHistory", OrderHistorySchema);
export default OrderHistoryModel;
