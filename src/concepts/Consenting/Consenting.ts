import { type Collection, type Db, MongoServerError } from "mongodb";

export class AlreadyConsented extends Error {}
export class NotConsented extends Error {}

interface ConsentDocument<Person, Use> {
  person: Person;
  use: Use;
}

/** Lets people agree to a particular use of their things, and withdraw that agreement later. */
export class ConsentingConcept<Person extends string, Use extends string> {
  private readonly consents: Collection<ConsentDocument<Person, Use>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Consenting") {
    this.consents = database.collection(`${name.toLowerCase()}.consents`);
  }

  /** Creates the unique index once. It makes MongoDB refuse a second consent by the same person to the same use, even when two requests arrive at once. If creating it fails, the next action tries again. */
  #ready() {
    this.indexes ??= this.consents
      .createIndex({ person: 1, use: 1 }, { unique: true })
      .catch((error: unknown) => {
        this.indexes = undefined;
        throw error;
      });
    return this.indexes;
  }

  async consent({ person, use }: { person: Person; use: Use }) {
    await this.#ready();
    try {
      await this.consents.insertOne({ person, use });
    } catch (error) {
      if (isDuplicate(error)) throw new AlreadyConsented("You have already consented to this.");
      throw error;
    }
    return { person, use };
  }

  async withdraw({ person, use }: { person: Person; use: Use }) {
    const { deletedCount } = await this.consents.deleteOne({ person, use });
    if (deletedCount === 0) throw new NotConsented("You haven't consented to this.");
    return { person, use };
  }

  async _consented({ person, use }: { person: Person; use: Use }) {
    const found = await this.consents.findOne({ person, use });
    return { consented: found !== null };
  }
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;
