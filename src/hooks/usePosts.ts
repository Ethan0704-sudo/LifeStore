import { useState, useEffect, useCallback } from "react";
import { getPosts, createPost, deletePost } from "../services/postService";
import { uploadMedia, deleteMedia } from "../services/storageService";
import {
  type Post,
  type DbPostInsert,
  dbPostToPost,
  postToDbPost,
} from "../types/database";

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  addPost: (
    post: Omit<Post, "id" | "timestamp">,
    mediaFile?: File,
  ) => Promise<void>;
  removePost: (id: string | number) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 帖子数据管理 Hook
 */
export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载帖子数据
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPosts();
      setPosts(data.map(dbPostToPost));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 添加帖子
  const addPost = useCallback(
    async (post: Omit<Post, "id" | "timestamp">, mediaFile?: File) => {
      try {
        setError(null);

        let mediaUrl = post.mediaUrl;

        // 如果有本地文件，先上传
        if (mediaFile) {
          mediaUrl = await uploadMedia(mediaFile);
        }

        const dbPost: DbPostInsert = {
          ...postToDbPost(post),
          media_url: mediaUrl || null,
        };

        const created = await createPost(dbPost);
        const newPost = dbPostToPost(created);

        // 添加到列表顶部
        setPosts((prev) => [newPost, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "创建帖子失败");
        throw err;
      }
    },
    [],
  );

  // 删除帖子
  const removePost = useCallback(
    async (id: string | number) => {
      try {
        setError(null);

        // 找到要删除的帖子
        const postToDelete = posts.find((p) => p.id === id);

        // 删除关联的媒体文件
        if (
          postToDelete?.mediaUrl &&
          postToDelete.mediaUrl.includes("supabase")
        ) {
          try {
            await deleteMedia(postToDelete.mediaUrl);
          } catch {
            console.warn("删除媒体文件失败，继续删除帖子");
          }
        }

        await deletePost(String(id));
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "删除帖子失败");
        throw err;
      }
    },
    [posts],
  );

  return {
    posts,
    loading,
    error,
    addPost,
    removePost,
    refresh: fetchPosts,
  };
}
