import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://gialai-ocop-be.onrender.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const targetUrl = `${BACKEND_URL}/api/auth/forgot-password${request.nextUrl.search}`;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");
    if (!headers.get("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
      redirect: "follow",
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}






