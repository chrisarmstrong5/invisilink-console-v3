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
    // First, get file metadata to check if content is available
    console.log(`[${slug}] Fetching from GitHub: ${owner}/${repo}/${filePath}`);
    const metaResponse = await fetch(
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

    console.log(`[${slug}] GitHub API response status: ${metaResponse.status}`);

    if (!metaResponse.ok) {
      const errorText = await metaResponse.text();
      console.error(`[${slug}] GitHub API error:`, errorText);
      return new NextResponse("White page not found", { status: 404 });
    }

    const fileData = await metaResponse.json();

    // For files >1MB, GitHub Contents API doesn't include content
    // We need to use the Git Blob API instead
    if (!fileData.content && fileData.sha) {
      console.log(`[${slug}] File too large, using Blob API with SHA: ${fileData.sha}`);
      const blobResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs/${fileData.sha}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          next: { revalidate: 0 },
        }
      );

      if (!blobResponse.ok) {
        console.error(`[${slug}] Blob API error: ${blobResponse.status}`);
        return new NextResponse("Error loading white page", { status: 500 });
      }

      const blobData = await blobResponse.json();
      const htmlContent = Buffer.from(blobData.content, "base64").toString("utf-8");
      console.log(`[${slug}] HTML content size (from blob): ${htmlContent.length} bytes`);

      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }

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
