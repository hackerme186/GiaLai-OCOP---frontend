import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase config exists
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase configuration missing",
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_ANON_KEY,
        },
        { status: 500 }
      );
    }

    // Test connection to Supabase
    const testUrl = `${SUPABASE_URL}/rest/v1/Enterprises?select=*&limit=1`;
    
    try {
      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          message: "Supabase connection successful",
          url: SUPABASE_URL,
          hasKey: !!SUPABASE_ANON_KEY,
          dataCount: Array.isArray(data) ? data.length : 0,
          status: response.status,
        });
      } else {
        const errorText = await response.text();
        return NextResponse.json(
          {
            success: false,
            error: "Supabase connection failed",
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500), // Limit error text
            url: SUPABASE_URL,
          },
          { status: response.status }
        );
      }
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to Supabase",
          message: errorMsg,
          url: SUPABASE_URL,
          suggestion: "Check if Supabase URL is correct and network is accessible",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}




