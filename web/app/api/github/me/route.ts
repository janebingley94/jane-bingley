import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  let token = "";

  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    token = "";
  }

  if (!token) token = process.env.GITHUB_TOKEN?.trim() ?? "";

  if (!token) return new NextResponse("缺少 token（未配置 GITHUB_TOKEN）", { status: 400 });

  const response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    return new NextResponse(
      message || `GitHub 请求失败 (${response.status})`,
      { status: response.status },
    );
  }

  const user = (await response.json()) as GitHubUser;
  return NextResponse.json(user);
}
