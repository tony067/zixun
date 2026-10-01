import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_REPORT_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTS = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"];

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getPublicRoot() {
  return path.join(process.env.APP_ROOT ?? process.cwd(), "public");
}

/** 评估报告文件（老师上传 PDF/图片/文档） */
export async function saveReportFile(file: File, counselorId: string) {
  if (!file) throw new Error("没有上传文件");
  if (file.size > MAX_REPORT_SIZE) throw new Error("文件不能超过 20MB");

  const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : "";
  if (!ALLOWED_EXTS.includes(ext)) {
    throw new Error("仅支持 PDF / Word / JPG / PNG 文件");
  }

  const safeId = sanitizeSegment(counselorId);
  const filename = `rpt_${safeId}_${Date.now()}.${ext}`;
  const uploadDir = path.join(getPublicRoot(), "uploads", "reports");

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/reports/${filename}`;
}
