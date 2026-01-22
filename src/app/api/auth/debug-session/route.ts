import { NextResponse } from "next/server";

/**
 * POST /api/auth/debug-session
 * Debug endpoint to log session data server-side (appears in Railway logs)
 *
 * This is temporary debugging for the 12-char refresh token issue.
 */
export async function POST(request: Request) {
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();

    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] === Debug Session Data Received ===`);
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] Source: ${body.source || "unknown"}`);
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] Session keys: ${JSON.stringify(body.sessionKeys)}`);
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] refresh_token (snake_case):`, JSON.stringify(body.refreshTokenSnake));
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] refreshToken (camelCase):`, JSON.stringify(body.refreshTokenCamel));
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] access_token info:`, JSON.stringify(body.accessTokenInfo));
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] expires_at:`, body.expiresAt);
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] user.id:`, body.userId);
    console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] Full session structure:`, JSON.stringify(body.fullSession, null, 2));

    // Log the final payload being sent to extension
    if (body.authPayload) {
      console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] === Auth Payload Being Sent ===`);
      console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] Payload token length:`, body.authPayload.tokenLength);
      console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] Payload refreshToken:`, JSON.stringify(body.authPayload.refreshToken));
      console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] Payload expiresAt:`, body.authPayload.expiresAt);
      console.log(`[${timestamp}] [AUTH-DEBUG-SESSION] Payload userId:`, body.authPayload.userId);

      if (body.authPayload.refreshToken?.length < 50) {
        console.error(`[${timestamp}] [AUTH-DEBUG-SESSION] !!! WARNING: refreshToken is only ${body.authPayload.refreshToken?.length} chars !!!`);
        console.error(`[${timestamp}] [AUTH-DEBUG-SESSION] !!! Full refreshToken value: ${body.authPayload.refreshToken?.fullValue} !!!`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[${timestamp}] [AUTH-DEBUG-SESSION] Error:`, error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
