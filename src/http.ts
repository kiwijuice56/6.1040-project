import { httpPolicy, type HttpPolicy } from "@mit-sdg/sync-engine-http/policy";
import { locationHttp } from "./compositions/location.ts";
import { postingHttp } from "./compositions/posting.ts";
import { searchingHttp } from "./compositions/searching.ts";
import { savingHttp } from "./compositions/saving.ts";
import { accountsHttp } from "./compositions/reusable/accounts.ts";
import { commonsHttp } from "./compositions/reusable/commons.ts";
import { passwordsHttp } from "./compositions/reusable/passwords.ts";

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
      ...passwordsHttp.publicErrors,
      ...postingHttp.publicErrors,
      ...locationHttp.publicErrors,
      ...searchingHttp.publicErrors,
      ...savingHttp.publicErrors,
    },
    cookies: {
      session: accountsHttp.sessionCookie("sticky-session", [
        ...commonsHttp.startingSessions,
        ...passwordsHttp.startingSessions,
      ]),
      signIn: commonsHttp.signInCookie("sticky-sign-in"),
    },
  });
}
