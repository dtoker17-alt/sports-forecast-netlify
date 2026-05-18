/**
 * proxy.js — Netlify Function
 * Proxies all Bzzoiro Sports API calls server-side.
 * The API key never reaches the browser.
 *
 * Usage from frontend:
 *   GET /.netlify/functions/proxy?path=/basketball/api/v2/events/&status=live
 *   GET /.netlify/functions/proxy?path=/tennis/api/v2/matches/live/
 *   GET /.netlify/functions/proxy?path=/basketball/api/v2/events/123/box-score/
 *
 * All query params except "path" are forwarded to Bzzoiro as-is.
 */

const BASE_URL = "https://sports.bzzoiro.com";

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
    };
  }

  const params = event.queryStringParameters || {};
  const apiPath = params.path;

  if (!apiPath) {
    return respond(400, { error: "Missing required query param: path" });
  }

  const apiKey = process.env.BZZOIRO_API_KEY;
  if (!apiKey) {
    return respond(500, { error: "BZZOIRO_API_KEY not configured in Netlify env" });
  }

  // Build upstream URL — forward all params except "path"
  const forward = Object.entries(params)
    .filter(([k]) => k !== "path")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const upstreamUrl = `${BASE_URL}${apiPath}${forward ? "?" + forward : ""}`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "SportsForecastPro/1.0",
      },
      // 12-second timeout guard
      signal: AbortSignal.timeout(12000),
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    let body;

    if (contentType.includes("application/json")) {
      body = await upstreamRes.json();
    } else {
      body = { raw: await upstreamRes.text() };
    }

    // Attach meta so frontend knows source + freshness
    const wrapped = {
      _meta: {
        upstream_status: upstreamRes.status,
        upstream_url: upstreamUrl.replace(apiKey, "***"),
        fetched_at: new Date().toISOString(),
      },
      data: body,
    };

    return respond(upstreamRes.status, wrapped);
  } catch (err) {
    console.error("Proxy error:", err.message);
    return respond(502, { error: "Upstream request failed", detail: err.message });
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function respond(status, body) {
  return {
    statusCode: status,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}
