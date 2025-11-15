import { NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * Kill List API Route
 *
 * Handles syncing kill list to GitHub repository
 * The kill list is a JSON file tracking burned/blocked affiliate links
 */

interface SyncKillListRequest {
  killListJson: string; // JSON string of the kill list
}

export async function POST(request: Request) {
  try {
    const { killListJson }: SyncKillListRequest = await request.json();

    if (!killListJson) {
      return NextResponse.json(
        { error: "Missing required field: killListJson" },
        { status: 400 }
      );
    }

    // Validate JSON
    try {
      JSON.parse(killListJson);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in killListJson" },
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

    const path = config.killSwitch.killListPath;

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
    } catch (error) {
      console.log(`Kill list file does not exist yet, creating new file`);
    }

    // Commit file (create or update)
    const base64Content = Buffer.from(killListJson, "utf-8").toString("base64");

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
          message: `Update kill list - ${new Date().toISOString()}`,
          content: base64Content,
          branch,
          ...(sha ? { sha } : {}),
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
    console.error("Kill list sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch kill list from GitHub
 */
export async function GET() {
  try {
    const { owner, repo, branch } = config.github;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const path = config.killSwitch.killListPath;

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist yet, return empty list
        return NextResponse.json({
          exists: false,
          content: JSON.stringify({ lastUpdated: null, totalKilled: 0, items: [] }),
        });
      }

      const errorText = await response.text();
      return NextResponse.json(
        { error: `GitHub API error: ${errorText}` },
        { status: response.status }
      );
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, "base64").toString("utf-8");

    return NextResponse.json({
      exists: true,
      content,
      sha: fileData.sha,
    });
  } catch (error) {
    console.error("Kill list fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
