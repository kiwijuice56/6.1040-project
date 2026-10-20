import { type Collection, type Db, ObjectId } from "mongodb";
import { scoreDocument, TOKEN_FUZZY } from "./tokenFuzzy.ts";

export class ContextNotFound extends Error {}
export class AlreadyIndexed extends Error {}
export class NotIndexed extends Error {}
export class InvalidBundle extends Error {}

export type SearchContext = string & { readonly __brand: "SearchContext" };

export type IndexedMember<Resource> = { resource: Resource; document: string };
export type Bundle<Resource> = IndexedMember<Resource>[] | { members: IndexedMember<Resource>[] };

interface ContextDocument {
  _id: SearchContext;
}

interface EntryDocument<Resource> {
  context: SearchContext;
  resource: Resource;
  document: string;
}

function membersOf<Resource extends string>(bundle: Bundle<Resource>): IndexedMember<Resource>[] | undefined {
  const rows = Array.isArray(bundle) ? bundle : bundle && Array.isArray(bundle.members) ? bundle.members : undefined;
  if (rows === undefined) return;
  const members: IndexedMember<Resource>[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (typeof row !== "object" || row === null) return;
    const resource = (row as { resource?: unknown }).resource;
    const document = (row as { document?: unknown }).document;
    if (typeof resource !== "string" || resource === "" || typeof document !== "string") return;
    if (seen.has(resource)) continue;
    seen.add(resource);
    members.push({ resource: resource as Resource, document });
  }
  return members;
}

/** Find the resources whose text is most relevant to a search. */
export class QueryingConcept<Resource extends string> {
  private readonly contexts: Collection<ContextDocument>;
  private readonly entries: Collection<EntryDocument<Resource>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Querying") {
    const prefix = name.toLowerCase();
    this.contexts = database.collection(`${prefix}.contexts`);
    this.entries = database.collection(`${prefix}.entries`);
  }

  #ready() {
    this.indexes ??= this.entries.createIndex({ context: 1, resource: 1 }, { unique: true }).catch((error: unknown) => {
      this.indexes = undefined;
      throw error;
    });
    return this.indexes;
  }

  async createContext(_input: Record<string, never> = {}) {
    await this.#ready();
    const context = new ObjectId().toHexString() as SearchContext;
    await this.contexts.insertOne({ _id: context });
    return { context };
  }

  async index({
    context,
    resource,
    document,
  }: {
    context: SearchContext;
    resource: Resource;
    document: string;
  }) {
    await this.#ready();
    if ((await this.contexts.findOne({ _id: context })) === null) {
      throw new ContextNotFound("There is no such search.");
    }
    try {
      await this.entries.insertOne({ context, resource, document });
    } catch (error: unknown) {
      if (isDuplicate(error)) throw new AlreadyIndexed("That resource is already in this search.");
      throw error;
    }
    return { resource };
  }

  async unindex({ context, resource }: { context: SearchContext; resource: Resource }) {
    if ((await this.contexts.findOne({ _id: context })) === null) {
      throw new ContextNotFound("There is no such search.");
    }
    const { deletedCount } = await this.entries.deleteOne({ context, resource });
    if (deletedCount === 0) throw new NotIndexed("That resource is not in this search.");
    return { resource };
  }

  async replace({ context, bundle }: { context: SearchContext; bundle: Bundle<Resource> }) {
    await this.#ready();
    if ((await this.contexts.findOne({ _id: context })) === null) {
      throw new ContextNotFound("There is no such search.");
    }
    const members = membersOf(bundle);
    if (members === undefined) throw new InvalidBundle("That is not a list of documents to search.");
    await this.entries.deleteMany({ context });
    if (members.length > 0) {
      await this.entries.insertMany(members.map((member) => ({ context, ...member })));
    }
    return { context };
  }

  async discard({ context }: { context: SearchContext }) {
    const { deletedCount } = await this.contexts.deleteOne({ _id: context });
    if (deletedCount === 0) throw new ContextNotFound("There is no such search.");
    await this.entries.deleteMany({ context });
    return { context };
  }

  async unindexEverywhere({ resource }: { resource: Resource }) {
    await this.entries.deleteMany({ resource });
    return { resource };
  }

  async reindexEverywhere({ resource, document }: { resource: Resource; document: string }) {
    await this.entries.updateMany({ resource }, { $set: { document } });
    return { resource };
  }

  async _getNResults({
    context,
    algorithm,
    query,
    resultCount,
  }: {
    context: SearchContext;
    algorithm: string;
    query: string;
    resultCount: number;
  }) {
    if ((await this.contexts.findOne({ _id: context })) === null) return [];
    if (algorithm !== TOKEN_FUZZY) return [];
    const count = Math.floor(Number(resultCount));
    if (!Number.isFinite(count) || count < 1) return [];
    if (typeof query !== "string" || query.trim() === "") return [];
    const cap = Math.min(count, 50);
    const rows = await this.entries.find({ context }).toArray();
    return rows
      .map((row) => ({ resource: row.resource, rank: scoreDocument(query, row.document) }))
      .filter((row) => row.rank > 0)
      .sort((a, b) => b.rank - a.rank || String(a.resource).localeCompare(String(b.resource)))
      .slice(0, cap);
  }

  async _indexed({ context }: { context: SearchContext }) {
    if ((await this.contexts.findOne({ _id: context })) === null) return [];
    const rows = await this.entries.find({ context }).toArray();
    return rows.map(({ resource, document }) => ({ resource, document }));
  }

  async _context({ context }: { context: SearchContext }) {
    return (await this.contexts.findOne({ _id: context })) === null ? [] : [{ context }];
  }
}

function isDuplicate(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
