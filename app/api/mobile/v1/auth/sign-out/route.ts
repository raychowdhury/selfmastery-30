import { apiOk, handler } from "@/lib/api/http";
import { revokeDeviceSession } from "@/lib/api/tokens";

/**
 * Revokes only the calling device's token. Signing out on a phone should not
 * sign the user out everywhere else.
 */
export const POST = handler(async (request) => {
  const header = request.headers.get("authorization");
  const token = header?.split(" ")[1]?.trim();
  if (token) await revokeDeviceSession(token);
  return apiOk({ ok: true });
});
