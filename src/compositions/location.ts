import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, Consenting } = concepts;

/** The one Feature Sticky asks Consenting about: keeping the map on the person's GPS. */
export const SHARING_LOCATION = "sharingLocation";

const sharingLocationInput: EndpointValidator = (value) => {
  const text = textInput(value);
  if (!text.ok) return text;
  if (typeof value !== "object" || value === null) return text;
  const feature = (value as { feature?: unknown }).feature;
  if (feature !== SHARING_LOCATION) return { ok: false, detail: "expected sharingLocation" };
  return { ok: true };
};

const ConsentLocation = endpoint(
  "/location/consent",
  ({ session, user, feature }) =>
    receive({ session, feature })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Consenting.consent({ person: user, use: feature }).responds({ person: user, use: feature }))
      .then(respond({})),
  { validators: { input: sharingLocationInput } },
);

const WithdrawLocation = endpoint(
  "/location/withdraw",
  ({ session, user, feature }) =>
    receive({ session, feature })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Consenting.withdraw({ person: user, use: feature }).responds({ person: user, use: feature }))
      .then(respond({})),
  { validators: { input: sharingLocationInput } },
);

const ReadLocationConsent = endpoint(
  "/location/status",
  ({ session, user, feature, consented }) =>
    receive({ session, feature })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(Consenting._consented({ person: user, use: feature }).is({ consented })).then(
          respond({ consented }),
        ),
      ),
  { validators: { input: sharingLocationInput } },
);

export const locationHttp = {
  publicErrors: {
    ALREADY_CONSENTED: "CONFLICT",
    NOT_CONSENTED: "CONFLICT",
  },
} as const;

export const composition = {
  sharing: { ConsentLocation, WithdrawLocation, ReadLocationConsent },
};
