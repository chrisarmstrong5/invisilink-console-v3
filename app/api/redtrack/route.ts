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

    console.log("[RedTrack API] Fetching:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("[RedTrack API] Status:", response.status);
    console.log("[RedTrack API] Content-Type:", response.headers.get("content-type"));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RedTrack API] Error response:", errorText.substring(0, 500));
      return NextResponse.json(
        {
          error: "RedTrack API request failed",
          status: response.status,
          url,
          details: "API returned non-200 status. Check API key validity."
        },
        { status: 500 }
      );
    }

    // Check if response is HTML (Swagger UI) instead of JSON
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/html")) {
      console.error("[RedTrack API] Received HTML instead of JSON");
      return NextResponse.json(
        {
          error: "RedTrack API returned HTML instead of JSON",
          url,
          details: "The API endpoint may have changed or the API key is invalid. RedTrack is returning their Swagger UI documentation page instead of data.",
          suggestion: "Please verify your RedTrack API key and endpoint URLs in the RedTrack dashboard."
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log("[RedTrack API] Success! Data keys:", Object.keys(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error("RedTrack API proxy error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch from RedTrack API",
        message: error instanceof Error ? error.message : String(error),
        endpoint,
        apiKey: `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`
      },
      { status: 500 }
    );
  }
}
