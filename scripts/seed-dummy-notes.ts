import { MongoClient } from "mongodb";
import { GeographicPostingConcept } from "../src/concepts/GeographicPosting/GeographicPosting.ts";
import { RegisteringConcept } from "../src/concepts/Registering/Registering.ts";

const USERNAME = "dummy";

const NOTES = [
  { body: "Killian grass is closed again.", location: { latitude: 42.3592, longitude: -71.092 } },
  { body: "Stata's doors are confusing on purpose.", location: { latitude: 42.3616, longitude: -71.0906 } },
  { body: "Kendall is windy. Hold onto your note.", location: { latitude: 42.3625, longitude: -71.0862 } },
  { body: "The student center has the good chairs.", location: { latitude: 42.359, longitude: -71.0949 } },
  { body: "Mass Ave bridge: look up, not at your phone.", location: { latitude: 42.3548, longitude: -71.0915 } },
] as const;

const url = process.env.MONGODB_URL;
if (!url) {
  throw new Error("MONGODB_URL is not set. Add it to your .env file.");
}

const client = new MongoClient(url);
await client.connect();
const db = client.db();

const registering = new RegisteringConcept(db);
const posting = new GeographicPostingConcept(db);

const existing = await registering._byUsername({ username: USERNAME });
const user = existing[0]?.user ?? (await registering.register({ username: USERNAME })).user;

const already = (await posting._allPosts()).filter((row) => row.author === user);
for (const row of already) {
  await posting.delete({ user, post: row.post });
}

for (const note of NOTES) {
  await posting.post({ user, body: note.body, location: note.location });
}

console.log(`Seeded ${NOTES.length} notes as ${USERNAME}.`);
await client.close();
