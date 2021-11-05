import mongoose from 'mongoose';

interface VideoInfo {
  name: string;
  size: number;
  duration: number;
  label: string;
  timelineStart: number | null;
  timelineEnd: number | null;
  progress: number;
  isConverted: boolean;
  error: string | null;
  url: string;
}

interface VideoNode {
  id: string;
  prevId?: string;
  layer: number;
  info: VideoInfo;
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
    info: {
      name: { type: String },
      size: { type: Number },
      duration: { type: Number },
      label: { type: String },
      timelineStart: { type: Number },
      timelineEnd: { type: Number },
      progress: { type: Number },
      error: { type: String },
      isConverted: { type: Boolean },
      url: { type: String },
    },
    children: { type: Array, required: true },
  },
  title: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  thumbnail: {
    name: { type: String },
    url: { type: String },
  },
  size: { type: Number, required: true },
  maxDuration: { type: Number, required: true },
  minDuration: { type: Number, required: true },
  views: { type: Number, required: true },
  isEditing: { type: Boolean, required: true },
  status: { type: String, enum: ['public', 'private'], required: true },
});

export default mongoose.model<VideoDocument>('Video', VideoSchema);
