import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Consenting.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { AlreadyConsented, ConsentingConcept, NotConsented } from "./Consenting.ts";

class Consenting extends ConsentingConcept<User, string> {}

export const consenting = registerConcept({
  class: Consenting,
  spec,
  refusals: {
    ALREADY_CONSENTED: AlreadyConsented,
    NOT_CONSENTED: NotConsented,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Consenting(database, name) },
});
