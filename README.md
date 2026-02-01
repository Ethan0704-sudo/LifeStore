# LifeStore 📦

个人档案馆 —— 一站式归档你的小红书和抖音内容

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)

## ✨ 功能特性

- 📝 支持小红书和抖音两种平台内容归档
- 🏷️ 智能标签解析（粘贴即自动提取话题）
- 📅 按日期分组展示，时间轴浏览
- 🖼️ 图片/视频媒体上传与存储
- 🔍 平台筛选快速查找
- 📥 一键下载媒体文件
- 📋 一键复制文案内容

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/LifeStore.git
cd LifeStore
npm install
```

### 2. 配置 Supabase

1. 创建 [Supabase](https://supabase.com) 项目
2. 复制环境变量配置：

```bash
cp .env.example .env
```

3. 编辑 `.env` 文件填入你的凭据：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase/init.sql`

### 4. 创建 Storage Bucket

- 进入 Supabase Storage
- 创建名为 `media` 的 bucket
- 设置为 **Public** 访问

### 5. 启动开发服务器

```bash
npm run dev
```

## 📁 项目结构

```
src/
├── lib/supabase.ts          # Supabase 客户端
├── types/database.ts        # 类型定义
├── services/
│   ├── postService.ts       # 帖子 CRUD API
│   └── storageService.ts    # 媒体存储 API
├── hooks/usePosts.ts        # 数据管理 Hook
└── App.tsx                  # 主应用组件
```

## 🛠️ 技术栈

| 技术          | 用途                            |
| ------------- | ------------------------------- |
| React 19      | UI 框架                         |
| TypeScript    | 类型安全                        |
| Vite          | 构建工具                        |
| TailwindCSS 4 | 样式框架                        |
| Supabase      | 后端服务 (PostgreSQL + Storage) |
| Lucide Icons  | 图标库                          |

## 📜 许可证

MIT License
