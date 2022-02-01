import * as VideoService from '../services/video.service';
import * as UploadService from '../services/upload.service';
import { HttpError } from '../models/error';
import { asyncHandler } from '../util/async-handler';

export const createVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const video = await VideoService.create(req.user.id);

  res.json({ video });
});

export const updateVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { uploadTree } = req.body;
  const { id } = req.params;

  await VideoService.update(id, uploadTree);

  res.json({ message: 'Upload progress saved' });
});

export const deleteVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  await VideoService.remove(id, req.user.id);

  // TODO: Delete videos & thumbnail from aws s3

  res.json({ message: 'Video deleted successfully' });
});

export const getCreatedVideos = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { page, max } = req.query as { [key: string]: string };

  const { videos, count } = await VideoService.findByCreator(
    req.user.id,
    page,
    max
  );

  res.json({ videos, count });
});

export const getCreatedVideo = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  const video = await VideoService.findOne(id);

  if (video.info.creator.toString() !== req.user.id) {
    throw new HttpError(403, 'Not authorized to this video');
  }

  res.json({ video });
});

export const getClientVideos = asyncHandler(async (req, res) => {
  const params = req.query as {
    page: string;
    max: string;
    search: string;
    channelId: string;
    currentUserId: string;
    ids: string[];
  };

  let result: any;

  if (params.search) {
    result = await VideoService.findClientByKeyword(params);
  } else if (params.channelId) {
    result = await VideoService.findClientByChannel(params);
  } else if (params.ids) {
    result = await VideoService.findClientByIds(params);
  } else {
    result = await VideoService.findClient(params);
  }

  res.json({ videos: result.videos, count: result.count });
});

export const getClientVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentUserId } = req.query as { [key: string]: string };

  await VideoService.incrementViews(id);
  const video = await VideoService.findClientOne(id, currentUserId);

  res.json({ video });
});

export const getFavorites = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const params = req.query as { page: string; max: string };

  const { videos, count } = await VideoService.findClientByFavorites(
    req.user.id,
    params
  );

  res.json({ videos, count });
});

export const toggleFavorites = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId } = req.body;

  const video = await VideoService.updateFavorites(videoId, req.user.id);

  res.json({ message: 'Added video to favorites', video });
});

export const initiateVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, isRoot, fileName, fileType } = req.body;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const uploadData = await UploadService.initiateMutlipart(
    fileType,
    isRoot,
    key
  );

  res.json({ uploadId: uploadData.UploadId });
});

export const processVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, partNumber } = req.body;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const presignedUrl = await UploadService.processMultipart(
    uploadId,
    partNumber,
    key
  );

  res.json({ presignedUrl });
});

export const completeVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName, parts } = req.body;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  const result = await UploadService.completeMultipart(uploadId, parts, key);

  res.json({ url: result.Key });
});

export const cancelVideoUpload = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { videoId, fileName } = req.query;
  const { uploadId } = req.params;

  const key = `videos/${req.user.id}/${videoId}/${fileName}`;

  await UploadService.cancelMultipart(uploadId, key);

  res.json({ message: 'Video upload cancelled' });
});

export const uploadThumbnail = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { thumbnail, fileType } = req.body as {
    thumbnail: { name: string; url: string };
    fileType: string;
  };

  const { presignedUrl, key } = await UploadService.uploadImage(
    fileType,
    thumbnail.url
  );

  res.json({ presignedUrl, key });
});

export const deleteThumbnail = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { key } = req.query as { [key: string]: string };

  await UploadService.deleteImage(key);

  res.json({ message: 'Thumbnail deleted' });
});
