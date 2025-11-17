import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * Dynamic White Page Route Handler
 *
 * Serves white pages by fetching them from GitHub repository
 * This allows us to serve pages without needing them in /public directory
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Get GitHub configuration
  const { owner, repo, branch } = config.github;
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return new NextResponse("Server configuration error", { status: 500 });
  }

  const filePath = `${config.whitePageProject.repoPath}/${slug}.html`;

  try {
    // Fetch file from GitHub
    console.log(`[${slug}] Fetching from GitHub: ${owner}/${repo}/${filePath}`);
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 0 }, // Don't cache in Next.js
      }
    );

    console.log(`[${slug}] GitHub API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${slug}] GitHub API error:`, errorText);
      return new NextResponse("White page not found", { status: 404 });
    }

    const fileData = await response.json();
    console.log(`[${slug}] File data size: ${fileData.content?.length || 0} bytes (base64)`);

    // Decode base64 content
    const htmlContent = Buffer.from(fileData.content, "base64").toString("utf-8");
    console.log(`[${slug}] HTML content size: ${htmlContent.length} bytes`);

    // Return HTML with proper headers
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error(`Error fetching white page ${slug}:`, error);
    return new NextResponse("Error loading white page", { status: 500 });
  }
}
