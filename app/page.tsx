'use client';

import { FormEvent, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/nest";

type User = {
  id: number;
  email: string;
  name: string | null;
};

type Post = {
  id: number;
  title: string;
  content: string | null;
  published: boolean | null;
};

const formStyles =
  "flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm";
const labelStyles = "text-sm font-medium text-zinc-700";
const inputStyles =
  "rounded-xl border border-zinc-300 px-4 py-2 text-base outline-none transition focus:border-black";
const buttonStyles =
  "mt-2 rounded-xl bg-black px-4 py-2 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `请求失败 (${response.status})`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export default function Home() {
  const [userStatus, setUserStatus] = useState<string>("");
  const [postStatus, setPostStatus] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<string>("");
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name")?.toString() || undefined,
      email: formData.get("email")!.toString(),
    };
    setUserStatus("提交中...");

    try {
      const user = await apiFetch<User>("/user", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUserStatus(`用户已创建 (ID: ${user.id})`);
      form.reset();
    } catch (error) {
      setUserStatus((error as Error).message);
    }
  };

  const handleCreatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      title: formData.get("title")!.toString(),
      content: formData.get("content")?.toString(),
      authorEmail: formData.get("authorEmail")!.toString(),
    };
    setPostStatus("提交中...");

    try {
      const post = await apiFetch<Post>("/post", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setPostStatus(`草稿创建成功 (ID: ${post.id})`);
      form.reset();
    } catch (error) {
      setPostStatus((error as Error).message);
    }
  };

  const handlePublishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const postId = formData.get("postId")!.toString();
    setPublishStatus("提交中...");

    try {
      const post = await apiFetch<Post>(`/publish/${postId}`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
      setPublishStatus(`文章已发布：${post.title}`);
      form.reset();
    } catch (error) {
      setPublishStatus((error as Error).message);
    }
  };

  const handleSearchPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const query = formData.get("keyword")!.toString();
    setSearchStatus("搜索中...");
    setSearchResults([]);

    try {
      const posts = await apiFetch<Post[]>(
        `/filtered-posts/${encodeURIComponent(query)}`,
        {
          method: "GET",
        },
      );
      setSearchResults(posts);
      setSearchStatus(posts.length ? `找到 ${posts.length} 篇文章` : "无匹配结果");
    } catch (error) {
      setSearchStatus((error as Error).message);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="rounded-2xl bg-black px-8 py-6 text-white shadow-lg">
        <h1 className="text-3xl font-semibold">博客内容管理</h1>
        <p className="mt-2 text-sm text-zinc-200">
          通过下方表单直接调用 Nest API（/user、/post、/publish/:id、/filtered-posts/:searchString）进行操作。
        </p>
        <p className="mt-2 text-xs text-zinc-300">
          当前 API 地址：{API_BASE_URL}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <form className={formStyles} onSubmit={handleCreateUser}>
          <h2 className="text-lg font-semibold">创建用户</h2>
          <label className={labelStyles}>
            邮箱（必填）
            <input
              className={inputStyles}
              type="email"
              name="email"
              placeholder="user@example.com"
              required
            />
          </label>
          <label className={labelStyles}>
            昵称（可选）
            <input
              className={inputStyles}
              type="text"
              name="name"
              placeholder="Jane"
            />
          </label>
          <button className={buttonStyles} type="submit">
            提交
          </button>
          {userStatus && (
            <p className="text-sm text-zinc-600 dark:text-zinc-200">
              {userStatus}
            </p>
          )}
        </form>

        <form className={formStyles} onSubmit={handleCreatePost}>
          <h2 className="text-lg font-semibold">创建帖子</h2>
          <label className={labelStyles}>
            标题
            <input
              className={inputStyles}
              type="text"
              name="title"
              placeholder="文章标题"
              required
            />
          </label>
          <label className={labelStyles}>
            内容
            <textarea
              className={`${inputStyles} min-h-24`}
              name="content"
              placeholder="可填写文章简介或正文"
            />
          </label>
          <label className={labelStyles}>
            作者邮箱
            <input
              className={inputStyles}
              type="email"
              name="authorEmail"
              placeholder="user@example.com"
              required
            />
          </label>
          <button className={buttonStyles} type="submit">
            创建草稿
          </button>
          {postStatus && (
            <p className="text-sm text-zinc-600 dark:text-zinc-200">
              {postStatus}
            </p>
          )}
        </form>

        <form className={formStyles} onSubmit={handlePublishPost}>
          <h2 className="text-lg font-semibold">发布文章</h2>
          <label className={labelStyles}>
            帖子 ID
            <input
              className={inputStyles}
              type="number"
              name="postId"
              placeholder="例如 1"
              min="1"
              required
            />
          </label>
          <button className={buttonStyles} type="submit">
            立即发布
          </button>
          {publishStatus && (
            <p className="text-sm text-zinc-600 dark:text-zinc-200">
              {publishStatus}
            </p>
          )}
        </form>

        <form className={formStyles} onSubmit={handleSearchPost}>
          <h2 className="text-lg font-semibold">搜索帖子</h2>
          <label className={labelStyles}>
            关键字
            <input
              className={inputStyles}
              type="text"
              name="keyword"
              placeholder="标题或正文关键词"
              required
            />
          </label>
          <button className={buttonStyles} type="submit">
            搜索
          </button>
          {searchStatus && (
            <p className="text-sm text-zinc-600 dark:text-zinc-200">
              {searchStatus}
            </p>
          )}
        </form>
      </section>

      {!!searchResults.length && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">搜索结果</h2>
          <ul className="mt-4 space-y-4">
            {searchResults.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium">{post.title}</p>
                  <span className="text-xs text-zinc-500">
                    {post.published ? "已发布" : "草稿"}
                  </span>
                </div>
                {post.content && (
                  <p className="mt-2 text-sm text-zinc-600">
                    {post.content}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
