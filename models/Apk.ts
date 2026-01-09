import mongoose, { Schema, Document } from 'mongoose';

export interface IApk extends Document {
  version: string;
  version_code: number;
  download_url: string;
  release_notes: string;
  is_active: boolean;
  force_update: boolean;
  min_android_version: number;
  created_at: Date;
  updated_at: Date;
}

const ApkSchema = new Schema<IApk>(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    version_code: {
      type: Number,
      required: true,
      unique: true,
    },
    download_url: {
      type: String,
      required: true,
    },
    release_notes: {
      type: String,
      default: '',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    force_update: {
      type: Boolean,
      default: false,
    },
    min_android_version: {
      type: Number,
      default: 21, // Android 5.0
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Índices para búsquedas eficientes
ApkSchema.index({ version_code: -1 });
ApkSchema.index({ is_active: 1 });
ApkSchema.index({ created_at: -1 });

export default mongoose.models.Apk || mongoose.model<IApk>('Apk', ApkSchema);
