import { NextResponse } from "next/server";
import { config } from "@/lib/config";

const API_KEY = config.tracker.redtrack.apiKey;
const BASE_URL = "https://api.redtrack.io/v1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "/campaigns";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupBy = searchParams.get("groupBy");

  try {
    let url = `${BASE_URL}${endpoint}`;

    // Add query parameters for reports
    if (from && to && groupBy) {
      const params = new URLSearchParams({
        from,
        to,
        groupBy,
      });
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`RedTrack API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("RedTrack API proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from RedTrack API" },
      { status: 500 }
    );
  }
}
