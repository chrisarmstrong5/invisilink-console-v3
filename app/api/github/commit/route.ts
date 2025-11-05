import { NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * GitHub API Route - Commit files to repository
 *
 * Handles committing white pages and domain usage JSON to GitHub
 * Uses GitHub Contents API with base64 encoding
 */

interface CommitRequest {
  path: string;
  content: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { path, content, message }: CommitRequest = await request.json();

    if (!path || !content || !message) {
      return NextResponse.json(
        { error: "Missing required fields: path, content, message" },
        { status: 400 }
      );
    }

    const { owner, repo, branch } = config.github;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub token not configured. Set GITHUB_TOKEN environment variable." },
        { status: 500 }
      );
    }

    // Get existing file SHA (if exists) - required for updates
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }
      // 404 is expected for new files, continue without SHA
    } catch (error) {
      console.log(`File ${path} does not exist yet, creating new file`);
    }

    // Commit file (create or update)
    const base64Content = Buffer.from(content, "utf-8").toString("base64");

    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message,
          content: base64Content,
          branch,
          ...(sha ? { sha } : {}), // Include SHA only if file exists
        }),
      }
    );

    if (!commitResponse.ok) {
      const errorText = await commitResponse.text();
      console.error("GitHub API error:", errorText);
      return NextResponse.json(
        { error: `GitHub commit failed: ${errorText}` },
        { status: commitResponse.status }
      );
    }

    const commitData = await commitResponse.json();

    return NextResponse.json({
      success: true,
      commitUrl: commitData.commit?.html_url,
      sha: commitData.content?.sha,
      path: commitData.content?.path,
    });
  } catch (error) {
    console.error("GitHub commit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
