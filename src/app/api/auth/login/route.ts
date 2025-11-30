import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://gialai-ocop-be.onrender.com";

async function handle(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const targetUrl = `${BACKEND_URL}/api/auth/login${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  
  const hasBody = !["GET", "HEAD"].includes(request.method);
  if (hasBody && !headers.get("content-type")) {
    headers.set("content-type", "application/json");
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    redirect: "follow",
  };

  try {
    const response = await fetch(targetUrl, init);
    const resHeaders = new Headers(response.headers);
    resHeaders.delete("content-encoding");
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("content-length");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream fetch failed";
    return new Response(JSON.stringify({ message, targetUrl }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

export { handle as GET, handle as POST };