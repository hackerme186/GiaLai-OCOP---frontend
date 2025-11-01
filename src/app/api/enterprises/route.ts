import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase config missing:', {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_ANON_KEY,
        url: SUPABASE_URL,
      });
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }
    
    console.log('Supabase config loaded:', {
      url: SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY,
    });

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

    // Try both table name cases
    const tableNames = ['Enterprises', 'enterprises'];
    let lastError: Error | null = null;
    
    for (const tableName of tableNames) {
      try {
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryParams.toString()}`;
        
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
          console.error(`Supabase API error for ${tableName}:`, response.status, errorText);
          if (response.status === 404 && tableName === 'Enterprises') {
            // Try lowercase if uppercase fails
            continue;
          }
          lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          continue;
        }

        const data = await response.json();
        
        // Get total count from content-range header
        const contentRange = response.headers.get("content-range");
        let total = 0;
        if (contentRange) {
          const parts = contentRange.split("/");
          if (parts.length > 1) {
            total = parseInt(parts[1]) || data.length || 0;
          }
        } else {
          total = Array.isArray(data) ? data.length : 0;
        }

        console.log(`Successfully fetched ${total} enterprises from ${tableName}`);
        
        return NextResponse.json({
          items: Array.isArray(data) ? data : [],
          total: total,
          page: page,
          limit: limit,
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`Error fetching from ${tableName}:`, err);
        if (tableName === 'Enterprises') {
          // Try lowercase if uppercase fails
          continue;
        }
      }
    }
    
    // If all attempts failed
    return NextResponse.json(
      { 
        error: "Failed to fetch enterprises from Supabase", 
        message: lastError?.message || "Unknown error",
        items: [],
        total: 0,
        page: page,
        limit: limit,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error fetching enterprises:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

