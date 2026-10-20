import { type Collection, type Db, MongoServerError, ObjectId } from "mongodb";

export class LabelNotFound extends Error {}
export class AlreadyLabeled extends Error {}
export class NotLabeled extends Error {}

export type Label = string & { readonly __brand: "Label" };

interface LabelDocument {
  _id: Label;
}

interface MembershipDocument<Resource> {
  label: Label;
  resource: Resource;
}

/** Group related resources under a shared tag. */
export class LabelingConcept<Resource extends string> {
  private readonly labels: Collection<LabelDocument>;
  private readonly memberships: Collection<MembershipDocument<Resource>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Labeling") {
    const prefix = name.toLowerCase();
    this.labels = database.collection(`${prefix}.labels`);
    this.memberships = database.collection(`${prefix}.memberships`);
  }

  #ready() {
    this.indexes ??= Promise.all([
      this.memberships.createIndex({ label: 1, resource: 1 }, { unique: true }),
      this.memberships.createIndex({ resource: 1 }),
    ]).catch((error: unknown) => {
      this.indexes = undefined;
      throw error;
    });
    return this.indexes;
  }

  async createLabel(_input: Record<string, never> = {}) {
    await this.#ready();
    const label = new ObjectId().toHexString() as Label;
    await this.labels.insertOne({ _id: label });
    return { label };
  }

  async applyLabel({ label, resource }: { label: Label; resource: Resource }) {
    await this.#ready();
    if ((await this.labels.findOne({ _id: label })) === null) {
      throw new LabelNotFound("There is no such label.");
    }
    try {
      await this.memberships.insertOne({ label, resource });
    } catch (error: unknown) {
      if (isDuplicate(error)) throw new AlreadyLabeled("That resource already has this label.");
      throw error;
    }
    return { resource };
  }

  async removeLabel({ label, resource }: { label: Label; resource: Resource }) {
    if ((await this.labels.findOne({ _id: label })) === null) {
      throw new LabelNotFound("There is no such label.");
    }
    const { deletedCount } = await this.memberships.deleteOne({ label, resource });
    if (deletedCount === 0) throw new NotLabeled("That resource does not have this label.");
    return { resource };
  }

  async delete({ label }: { label: Label }) {
    const { deletedCount } = await this.labels.deleteOne({ _id: label });
    if (deletedCount === 0) throw new LabelNotFound("There is no such label.");
    await this.memberships.deleteMany({ label });
    return { label };
  }

  async unlabelEverywhere({ resource }: { resource: Resource }) {
    await this.memberships.deleteMany({ resource });
    return { resource };
  }

  async _resources({ label }: { label: Label }) {
    if ((await this.labels.findOne({ _id: label })) === null) return [];
    const rows = await this.memberships.find({ label }).sort({ _id: 1 }).toArray();
    return rows.map(({ resource }) => ({ resource }));
  }

  async _labels({ resource }: { resource: Resource }) {
    const rows = await this.memberships.find({ resource }).sort({ _id: 1 }).toArray();
    return rows.map(({ label }) => ({ label }));
  }

  async _has({ label, resource }: { label: Label; resource: Resource }) {
    const found = await this.memberships.findOne({ label, resource });
    return found === null ? [] : [{ resource: found.resource }];
  }

  async _label({ label }: { label: Label }) {
    return (await this.labels.findOne({ _id: label })) === null ? [] : [{ label }];
  }
}

const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;
