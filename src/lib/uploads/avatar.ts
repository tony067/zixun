import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getPublicRoot() {
  return path.join(process.env.APP_ROOT ?? process.cwd(), "public");
}

export async function saveAvatarFile(file: File, userId: string) {
  if (!file) {
    throw new Error("没有上传文件");
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("图片不能超过 5MB");
  }

  const extFromMime = MIME_TO_EXT[file.type];
  const extFromName = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : "";
  const ext = extFromMime ?? extFromName;

  if (!ext || !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    throw new Error("仅支持 JPG / PNG / WebP / GIF 图片");
  }

  const safeUserId = sanitizeSegment(userId);
  const filename = `${safeUserId}_${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`;
  const uploadDir = path.join(getPublicRoot(), "uploads", "avatars");

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/avatars/${filename}`;
}
