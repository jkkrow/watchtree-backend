import mongoose from 'mongoose';

interface VideoNode {
  id: string;
  prevId?: string;
  layer: number;
  info: any;
  children: VideoNode[];
}

export enum VideoStatus {
  Public = 'public',
  Private = 'private',
}

export interface VideoDocument extends mongoose.Document {
  root: VideoNode;
  title: string;
  tags: string[];
  description: string;
  thumbnail: { name: string; url: string };
  size: number;
  maxDuration: number;
  minDuration: number;
  views: number;
  isEditing: boolean;
  status: VideoStatus;
}

const VideoSchema = new mongoose.Schema({
  root: {
    id: { type: String, required: true },
    layer: { type: Number, required: false },
    info: { type: Object },
    children: { type: Array, required: true },
  },
  title: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  thumbnail: {
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  size: { type: Number, required: true },
  maxDuration: { type: Number, required: true },
  minDuration: { type: Number, required: true },
  views: { type: Number, required: true },
  isEditing: { type: Boolean, required: true },
  status: { type: String, enum: ['public', 'private'], required: true },
});

export default mongoose.model<VideoDocument>('Video', VideoSchema);
