// 数据库表类型定义

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          created_at: string;
          platform: "xhs" | "tiktok";
          title: string;
          content: string | null;
          tags: string[];
          media_type: "image" | "video" | null;
          media_url: string | null;
          likes: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          platform: "xhs" | "tiktok";
          title: string;
          content?: string | null;
          tags?: string[];
          media_type?: "image" | "video" | null;
          media_url?: string | null;
          likes?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          platform?: "xhs" | "tiktok";
          title?: string;
          content?: string | null;
          tags?: string[];
          media_type?: "image" | "video" | null;
          media_url?: string | null;
          likes?: number;
        };
      };
    };
  };
}

// 前端使用的 Post 类型（兼容现有代码）
export interface Post {
  id: number | string;
  timestamp: Date;
  platform: string;
  title: string;
  content: string;
  tags: string[];
  mediaType: string;
  mediaUrl: string;
  likes: number;
}

// 数据库行类型别名
export type DbPost = Database["public"]["Tables"]["posts"]["Row"];
export type DbPostInsert = Database["public"]["Tables"]["posts"]["Insert"];

// 数据库格式转前端格式
export function dbPostToPost(dbPost: DbPost): Post {
  return {
    id: dbPost.id,
    timestamp: new Date(dbPost.created_at),
    platform: dbPost.platform,
    title: dbPost.title,
    content: dbPost.content || "",
    tags: dbPost.tags || [],
    mediaType: dbPost.media_type || "image",
    mediaUrl: dbPost.media_url || "",
    likes: dbPost.likes,
  };
}

// 前端格式转数据库格式
export function postToDbPost(
  post: Omit<Post, "id" | "timestamp">,
): DbPostInsert {
  return {
    platform: post.platform as "xhs" | "tiktok",
    title: post.title,
    content: post.content || null,
    tags: post.tags,
    media_type: post.mediaType as "image" | "video" | null,
    media_url: post.mediaUrl || null,
    likes: post.likes,
  };
}
