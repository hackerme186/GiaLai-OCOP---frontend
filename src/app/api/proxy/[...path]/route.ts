import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://gialai-ocop-be.onrender.com";

async function handle(request: NextRequest, { params }: { params: { path: string[] } }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  const targetPath = `/${(params.path || []).join("/")}`;
  const targetUrl = `${BACKEND_URL}${targetPath}${request.nextUrl.search}`;

  // Clone headers, dropping hop-by-hop/forbidden ones
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  // Ensure JSON content-type when proxying JSON body
  const hasBody = !["GET", "HEAD"].includes(request.method);
  if (hasBody && !headers.get("content-type")) {
    headers.set("content-type", "application/json");
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    // Follow redirects from upstream
    redirect: "follow",
  };

  let response: Response;
  try {
    response = await fetch(targetUrl, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream fetch failed";
    return new Response(JSON.stringify({ message, targetUrl }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  // Log for debugging (remove in production)
  console.log(`[PROXY] ${request.method} ${targetUrl} -> ${response.status} ${response.statusText}`);

  // Stream/return the response with original headers
  const resHeaders = new Headers(response.headers);
  // Upstream may be gzip/br encoded; fetch already decodes for us on server.
  // Remove encoding/length headers to avoid browser double-decoding errors.
  resHeaders.delete("content-encoding");
  resHeaders.delete("transfer-encoding");
  resHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: resHeaders,
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };


