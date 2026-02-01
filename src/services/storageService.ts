import { supabase } from "../lib/supabase";

const BUCKET_NAME = "media";

/**
 * 上传媒体文件到 Supabase Storage
 * @param file 要上传的文件
 * @returns 上传后的公开 URL
 */
export async function uploadMedia(file: File): Promise<string> {
  // 生成唯一文件名
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("上传文件失败:", error);
    throw error;
  }

  // 获取公开 URL
  return getMediaUrl(filePath);
}

/**
 * 获取媒体文件的公开 URL
 */
export function getMediaUrl(path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return publicUrl;
}

/**
 * 删除媒体文件
 */
export async function deleteMedia(url: string): Promise<void> {
  // 从 URL 中提取文件路径
  const urlObj = new URL(url);
  const pathMatch = urlObj.pathname.match(
    /\/storage\/v1\/object\/public\/media\/(.+)/,
  );

  if (!pathMatch) {
    console.warn("无法解析媒体文件路径:", url);
    return;
  }

  const filePath = pathMatch[1];

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    console.error("删除文件失败:", error);
    throw error;
  }
}

/**
 * 检查 Storage Bucket 是否存在
 */
export async function checkBucketExists(): Promise<boolean> {
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("检查 Bucket 失败:", error);
    return false;
  }

  return data.some((bucket) => bucket.name === BUCKET_NAME);
}
