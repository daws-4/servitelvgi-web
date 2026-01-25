import mongoose from "mongoose";

export interface IDataUsage {
    Installer_id: string;
    MobileData: string;
    WifiData: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const DataUsageSchema = new mongoose.Schema(
    {
        Installer_id: {
            type: String,
            required: true,
        },
        MobileData: {
            type: String,
            required: true,
        },
        WifiData: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const DataUsageModel = mongoose.models?.DataUsage || mongoose.model("DataUsage", DataUsageSchema);
export default DataUsageModel;
