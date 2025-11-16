/**
 * Kill Link API Endpoint
 *
 * POST /api/links/[slug]/kill
 * Marks a link as killed (burned) and adds to kill list
 */

import { NextResponse } from "next/server";
import { linksRepository } from "@/lib/db/repositories";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { reason } = await request.json();

    console.log(`[Kill Link] Killing link: ${slug}`);

    await linksRepository.kill(slug, reason);

    console.log(`[Kill Link] ✅ Link ${slug} killed successfully`);

    return NextResponse.json({
      success: true,
      slug,
      killed: true,
    });
  } catch (error) {
    console.error("[Kill Link] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
