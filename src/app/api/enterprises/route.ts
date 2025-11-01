import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build Supabase query
    let queryParams = new URLSearchParams();
    queryParams.append("select", "*");
    queryParams.append("limit", String(limit));
    queryParams.append("offset", String(offset));
    
    // Add filters if provided
    const search = searchParams.get("search");
    if (search) {
      queryParams.append("name", `ilike.%${search}%`);
    }
    const field = searchParams.get("field");
    if (field) {
      queryParams.append("BusinessField", `ilike.%${field}%`);
    }

    const url = `${SUPABASE_URL}/rest/v1/Enterprises?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "count=exact",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch enterprises", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const total = parseInt(response.headers.get("content-range")?.split("/")[1] || String(data.length || 0));

    return NextResponse.json({
      items: Array.isArray(data) ? data : [],
      total: total,
      page: page,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching enterprises:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

