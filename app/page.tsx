'use client';

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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

type TokenEntry = {
  id: string;
  label: string;
  token: string;
};

type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
  followers: number;
  following: number;
  public_repos: number;
};

const formStyles =
  "flex flex-col gap-4 rounded-2xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/40";
const panelStyles =
  "rounded-2xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/40";
const labelStyles = "text-sm font-medium text-zinc-700 dark:text-zinc-200";
const inputStyles =
  "mt-2 w-full rounded-xl border border-zinc-300/80 bg-white/60 px-4 py-2.5 text-base text-zinc-900 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-indigo-400/80 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700/70 dark:bg-zinc-950/40 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400/60 dark:focus:ring-indigo-400/20";
const buttonStyles =
  "mt-1 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50";
const buttonSecondaryStyles =
  "inline-flex items-center justify-center rounded-xl border border-zinc-300/80 bg-white/60 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 dark:border-zinc-700/70 dark:bg-zinc-950/40 dark:text-zinc-50 dark:hover:bg-zinc-900/50";
const buttonGhostStyles =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 dark:text-zinc-200 dark:hover:bg-zinc-900/40";
const statusStyles =
  "mt-3 rounded-xl border border-zinc-200/70 bg-zinc-50/70 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-900/30 dark:text-zinc-200";

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

async function githubFetchMe(token: string): Promise<GitHubUser> {
  const response = await fetch("/api/github/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(token ? { token } : {}),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `请求失败 (${response.status})`);
  }

  return response.json() as Promise<GitHubUser>;
}

export default function Home() {
  const [userStatus, setUserStatus] = useState<string>("");
  const [usersStatus, setUsersStatus] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [postStatus, setPostStatus] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<string>("");
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [tokenEntries, setTokenEntries] = useState<TokenEntry[]>([]);
  const [githubStatus, setGithubStatus] = useState<string>("");
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string>("");
  const [activeSourceLabel, setActiveSourceLabel] = useState<string>("");

  const activeEntry = useMemo(
    () => tokenEntries.find((entry) => entry.id === activeEntryId) ?? null,
    [activeEntryId, tokenEntries],
  );

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersStatus("加载中...");

    try {
      const list = await apiFetch<User[]>("/users", { method: "GET" });
      setUsers(list);
      setUsersStatus(list.length ? `共 ${list.length} 个用户` : "暂无用户");
    } catch (error) {
      setUsersStatus((error as Error).message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (user: User) => {
    const ok = window.confirm(
      `确定删除用户？\n\nID: ${user.id}\nEmail: ${user.email}`,
    );
    if (!ok) return;

    setDeletingUserId(user.id);
    setUsersStatus("删除中...");
    try {
      await apiFetch<void>(`/user/${user.id}`, { method: "DELETE" });
      setUsersStatus("删除成功，已刷新列表");
      await fetchUsers();
    } catch (error) {
      setUsersStatus((error as Error).message);
    } finally {
      setDeletingUserId(null);
    }
  };

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
      await fetchUsers();
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

  const handleAddTokenEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const label = (formData.get("label")?.toString() ?? "").trim();
    const token = (formData.get("token")?.toString() ?? "").trim();

    if (!label || !token) {
      setGithubStatus("请填写名称和 token");
      return;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setTokenEntries((prev) => [{ id, label, token }, ...prev]);
    setGithubStatus("已添加");
    form.reset();
  };

  const handleDeleteTokenEntry = (id: string) => {
    setTokenEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (activeEntryId === id) {
      setActiveEntryId("");
      setGithubUser(null);
      setGithubStatus("");
    }
  };

  const handleFetchGitHubMe = async (entry: TokenEntry) => {
    setActiveEntryId(entry.id);
    setActiveSourceLabel(entry.label);
    setGithubUser(null);
    setGithubStatus("请求中...");

    try {
      const user = await githubFetchMe(entry.token);
      setGithubUser(user);
      setGithubStatus(`获取成功：${user.login}`);
    } catch (error) {
      setGithubStatus((error as Error).message);
    }
  };

  const handleFetchGitHubMeByEnv = async () => {
    setActiveEntryId("");
    setActiveSourceLabel("环境变量 GITHUB_TOKEN");
    setGithubUser(null);
    setGithubStatus("请求中...");

    try {
      const user = await githubFetchMe("");
      setGithubUser(user);
      setGithubStatus(`获取成功：${user.login}`);
    } catch (error) {
      setGithubStatus((error as Error).message);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-zinc-100 text-zinc-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-black dark:text-zinc-50">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/25 via-cyan-500/20 to-fuchsia-500/20 blur-3xl dark:from-indigo-500/15 dark:via-cyan-500/10 dark:to-fuchsia-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top,rgba(24,24,27,0.7),rgba(0,0,0,0))]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className={panelStyles}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
                Nest API Console
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                博客内容管理
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                使用下方表单快速调用接口完成用户、文章与搜索操作，并在同页查看 GitHub 账户信息。
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                当前 API 地址
              </p>
              <p className="mt-2 inline-flex rounded-xl bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-50 dark:bg-zinc-800">
                {API_BASE_URL}
              </p>
            </div>
          </div>
        </header>

        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Nest API 操作
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                对应接口：<span className="font-mono">/user</span>、{" "}
                <span className="font-mono">/post</span>、{" "}
                <span className="font-mono">/publish/:id</span>、{" "}
                <span className="font-mono">/filtered-posts/:searchString</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <form className={formStyles} onSubmit={handleCreateUser}>
              <div>
                <h3 className="text-base font-semibold">创建用户</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  用邮箱创建用户，昵称可选。
                </p>
              </div>
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
                <p className={statusStyles} role="status">
                  {userStatus}
                </p>
              )}
            </form>

            <form className={formStyles} onSubmit={handleCreatePost}>
              <div>
                <h3 className="text-base font-semibold">创建帖子</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  创建草稿，并指定作者邮箱。
                </p>
              </div>
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
                  className={`${inputStyles} min-h-28 resize-y`}
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
                <p className={statusStyles} role="status">
                  {postStatus}
                </p>
              )}
            </form>

            <form className={formStyles} onSubmit={handlePublishPost}>
              <div>
                <h3 className="text-base font-semibold">发布文章</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  输入帖子 ID 将草稿发布。
                </p>
              </div>
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
                <p className={statusStyles} role="status">
                  {publishStatus}
                </p>
              )}
            </form>

            <form className={formStyles} onSubmit={handleSearchPost}>
              <div>
                <h3 className="text-base font-semibold">搜索帖子</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  在标题或正文中按关键字检索。
                </p>
              </div>
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
                <p className={statusStyles} role="status">
                  {searchStatus}
                </p>
              )}
            </form>
          </div>
        </section>

        <section className={panelStyles}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">用户列表</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                对应接口：<span className="font-mono">/users</span>
              </p>
            </div>
            <button
              type="button"
              className={buttonSecondaryStyles}
              onClick={() => void fetchUsers()}
              disabled={usersLoading}
            >
              {usersLoading ? "刷新中..." : "刷新列表"}
            </button>
          </div>

          {usersStatus && (
            <p className={statusStyles} role="status">
              {usersStatus}
            </p>
          )}

          {users.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
              暂无用户
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="rounded-xl border border-zinc-200/60 bg-white/50 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {user.name ?? "未命名用户"}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-zinc-200/70 bg-white/60 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-200">
                        ID {user.id}
                      </span>
                      <button
                        type="button"
                        className={buttonSecondaryStyles}
                        onClick={() => void handleDeleteUser(user)}
                        disabled={deletingUserId === user.id}
                      >
                        {deletingUserId === user.id ? "删除中..." : "删除"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={panelStyles}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                GitHub 个人信息
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                用「名称 + Personal Token」保存多个来源，或直接使用环境变量{" "}
                <span className="font-mono">GITHUB_TOKEN</span> 获取默认账户信息（{" "}
                <span className="font-mono">/api/github/me</span>）。
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              type="button"
              onClick={handleFetchGitHubMeByEnv}
            >
              使用默认 GITHUB_TOKEN 获取
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <form className={formStyles} onSubmit={handleAddTokenEntry}>
              <div>
                <h3 className="text-base font-semibold">新增 token</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  仅保存在浏览器内存中，刷新会清空。
                </p>
              </div>
              <label className={labelStyles}>
                名称
                <input
                  className={inputStyles}
                  type="text"
                  name="label"
                  placeholder="例如：工作账号"
                  required
                />
              </label>
              <label className={labelStyles}>
                Personal Token
                <input
                  className={inputStyles}
                  type="password"
                  name="token"
                  placeholder="ghp_..."
                  required
                />
              </label>
              <button className={buttonStyles} type="submit">
                添加
              </button>
              {githubStatus && (
                <p className={statusStyles} role="status">
                  {githubStatus}
                </p>
              )}
            </form>

            <div className="rounded-2xl border border-zinc-200/70 bg-white/50 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/30">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">已保存记录</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    选择一个来源并拉取个人信息。
                  </p>
                </div>
                {tokenEntries.length > 0 && (
                  <button
                    type="button"
                    className={buttonGhostStyles}
                    onClick={() => {
                      setTokenEntries([]);
                      setActiveEntryId("");
                      setGithubUser(null);
                      setGithubStatus("");
                    }}
                  >
                    清空
                  </button>
                )}
              </div>

              {tokenEntries.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                  暂无记录
                </p>
              ) : (
                <ul className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
                  {tokenEntries.map((entry) => {
                    const isActive = entry.id === activeEntryId;
                    return (
                      <li
                        key={entry.id}
                        className={[
                          "flex items-center justify-between gap-3 rounded-xl border p-3 shadow-sm transition",
                          isActive
                            ? "border-indigo-300/60 bg-indigo-50/60 dark:border-indigo-400/30 dark:bg-indigo-500/10"
                            : "border-zinc-200/60 bg-white/50 hover:border-zinc-300/70 dark:border-zinc-800/60 dark:bg-zinc-950/20 dark:hover:border-zinc-700/70",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {entry.label}
                          </p>
                          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {isActive ? "当前选择" : "点击获取信息"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            type="button"
                            onClick={() => handleFetchGitHubMe(entry)}
                          >
                            获取
                          </button>
                          <button
                            className={buttonSecondaryStyles}
                            type="button"
                            onClick={() => handleDeleteTokenEntry(entry.id)}
                          >
                            删除
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {githubUser && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/70 bg-gradient-to-b from-white/70 to-white/40 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:from-zinc-950/50 dark:to-zinc-950/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Image
                    src={githubUser.avatar_url}
                    alt={githubUser.login}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full border border-zinc-200/70 shadow-sm dark:border-zinc-800/70"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">
                      {githubUser.name ?? githubUser.login}
                    </p>
                    <a
                      className="truncate text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                      href={githubUser.html_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {githubUser.html_url}
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-200">
                    Followers {githubUser.followers}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-200">
                    Following {githubUser.following}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-200">
                    Repos {githubUser.public_repos}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-zinc-700 dark:text-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
                <p>
                  <span className="text-zinc-500 dark:text-zinc-400">Login：</span>
                  {githubUser.login}
                </p>
                <p>
                  <span className="text-zinc-500 dark:text-zinc-400">ID：</span>
                  {githubUser.id}
                </p>
                <p className="sm:col-span-2 lg:col-span-1">
                  <span className="text-zinc-500 dark:text-zinc-400">Email：</span>
                  {githubUser.email ?? "-"}
                </p>
              </div>

              {(activeEntry || activeSourceLabel) && (
                <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  来源：{activeEntry?.label ?? activeSourceLabel}
                </p>
              )}
            </div>
          )}
        </section>

      {!!searchResults.length && (
        <section className={panelStyles}>
          <h2 className="text-xl font-semibold tracking-tight">搜索结果</h2>
          <ul className="mt-5 space-y-4">
            {searchResults.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-zinc-200/60 bg-white/50 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/20"
              >
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium">{post.title}</p>
                  <span className="text-xs text-zinc-500">
                    {post.published ? "已发布" : "草稿"}
                  </span>
                </div>
                {post.content && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {post.content}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>
    </main>
  );
}
