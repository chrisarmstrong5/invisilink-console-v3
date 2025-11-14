import { NextResponse } from "next/server";
import { generateWhitePage } from "@/lib/white-page-generator";
import { config } from "@/lib/config";
import fs from "fs/promises";
import path from "path";

/**
 * White Page Generation API Route
 *
 * Generates a white page from template, commits to GitHub, and tracks domain usage
 */

interface GenerateRequest {
  offerKey: string;
  source: string;
  trackingUrl: string;
  filterType?: "params-only" | "advanced";
  domain: string;
}

export async function POST(request: Request) {
  try {
    const { offerKey, source, trackingUrl, filterType = "params-only", domain }: GenerateRequest = await request.json();

    if (!offerKey || !source || !trackingUrl || !domain) {
      return NextResponse.json(
        { error: "Missing required fields: offerKey, source, trackingUrl, domain" },
        { status: 400 }
      );
    }

    // 1. Generate white page HTML
    const { slug, whitePageHtml, templateName } = await generateWhitePage({
      offerKey,
      source,
      trackingUrl,
      filterType,
    });

    // 2. Store in database for dynamic serving
    // For now, we'll just commit to GitHub and serve from there

    // 3. Commit to GitHub directly
    const { owner, repo, branch } = config.github;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const filePath = `${config.whitePageProject.repoPath}/${slug}.html`;

    // Get existing file SHA (if exists)
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`,
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
    } catch {
      console.log(`File ${filePath} does not exist yet, creating new file`);
    }

    // Commit file
    const base64Content = Buffer.from(whitePageHtml, "utf-8").toString("base64");

    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message: `Add white page ${slug}`,
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
    const commitUrl = commitData.commit?.html_url;

    // 4. Save domain usage to JSON file
    const domainUsagePath = path.join(process.cwd(), "public/link-generator/domain-usage.json");

    try {
      const usageData = JSON.parse(await fs.readFile(domainUsagePath, "utf-8"));
      usageData[domain] = (usageData[domain] || 0) + 1;
      await fs.writeFile(domainUsagePath, JSON.stringify(usageData, null, 2));
    } catch (error) {
      console.error("Failed to update domain usage:", error);
      // Don't fail the request if domain usage update fails
    }

    return NextResponse.json({
      success: true,
      slug,
      templateName,
      commitUrl,
    });
  } catch (error) {
    console.error("White page generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate white page" },
      { status: 500 }
    );
  }
}
