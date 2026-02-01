import { supabase } from "../lib/supabase";
import type { DbPost, DbPostInsert } from "../types/database";

/**
 * 获取所有帖子（按创建时间倒序）
 */
export async function getPosts(): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取帖子失败:", error);
    throw error;
  }

  return (data || []) as DbPost[];
}

/**
 * 创建新帖子
 */
export async function createPost(post: DbPostInsert): Promise<DbPost> {
  const { data, error } = await supabase
    .from("posts")
    .insert(post as never)
    .select()
    .single();

  if (error) {
    console.error("创建帖子失败:", error);
    throw error;
  }

  return data as DbPost;
}

/**
 * 删除帖子
 */
export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    console.error("删除帖子失败:", error);
    throw error;
  }
}

/**
 * 更新帖子
 */
export async function updatePost(
  id: string,
  updates: Partial<DbPostInsert>,
): Promise<DbPost> {
  const { data, error } = await supabase
    .from("posts")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("更新帖子失败:", error);
    throw error;
  }

  return data as DbPost;
}

/**
 * 点赞帖子
 */
export async function likePost(id: string): Promise<DbPost> {
  // 先获取当前点赞数
  const { data: current } = await supabase
    .from("posts")
    .select("likes")
    .eq("id", id)
    .single();

  const currentData = current as { likes: number } | null;
  const newLikes = (currentData?.likes || 0) + 1;

  return updatePost(id, { likes: newLikes });
}
