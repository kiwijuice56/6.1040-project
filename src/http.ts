import { httpPolicy, type HttpPolicy } from "@mit-sdg/sync-engine-http/policy";
import { postingHttp } from "./compositions/posting.ts";
import { accountsHttp } from "./compositions/reusable/accounts.ts";
import { commonsHttp } from "./compositions/reusable/commons.ts";

/**
 * The HTTP category the server returns for each refusal. A refusal missing here
 * reaches the browser as INTERNAL_ERROR (500). Each way of signing in declares
 * its categories beside its endpoints.
 */
export function stickyPolicy(publicOrigin: string): HttpPolicy {
  return httpPolicy({
    publicOrigin,
    basePath: "/api",
    publicErrors: {
      ...accountsHttp.publicErrors,
      ...commonsHttp.publicErrors,
      ...postingHttp.publicErrors,
      ALREADY_CONSENTED: "CONFLICT",
      NOT_CONSENTED: "CONFLICT",
    },
    cookies: {
      session: accountsHttp.sessionCookie("sticky-session", [...commonsHttp.startingSessions]),
      signIn: commonsHttp.signInCookie("sticky-sign-in"),
    },
  });
}
