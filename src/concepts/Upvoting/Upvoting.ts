import { type Collection, type Db, MongoServerError } from "mongodb";

export class AlreadyVoted extends Error {}
export class NoVote extends Error {}

interface VoteDocument<User, Resource> {
  resource: Resource;
  voter: User;
  upvote: boolean;
}

/** Record each person's approval or disapproval of a contribution so contributions can be ranked. */
export class UpvotingConcept<User extends string, Resource extends string> {
  private readonly votes: Collection<VoteDocument<User, Resource>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Upvoting") {
    this.votes = database.collection(`${name.toLowerCase()}.votes`);
  }

  /** Creates the unique index once. It makes MongoDB refuse a second vote by the same voter on the same resource, even when two requests arrive at once. If creating it fails, the next action tries again. */
  #ready() {
    this.indexes ??= this.votes
      .createIndex({ voter: 1, resource: 1 }, { unique: true })
      .catch((error: unknown) => {
        this.indexes = undefined;
        throw error;
      });
    return this.indexes;
  }

  async upvote({ voter, resource }: { voter: User; resource: Resource }) {
    await this.#add(voter, resource, true);
    return { resource };
  }

  async downvote({ voter, resource }: { voter: User; resource: Resource }) {
    await this.#add(voter, resource, false);
    return { resource };
  }

  async unvote({ voter, resource }: { voter: User; resource: Resource }) {
    const { deletedCount } = await this.votes.deleteOne({ voter, resource });
    if (deletedCount === 0) throw new NoVote("You have not voted on this.");
    return { resource };
  }

  async clearAllVotes({ resource }: { resource: Resource }) {
    await this.votes.deleteMany({ resource });
    return { resource };
  }

  async _getVoteCount({ resource }: { resource: Resource }) {
    const rows = await this.votes.find({ resource }).toArray();
    const count = rows.reduce((total, vote) => total + (vote.upvote ? 1 : -1), 0);
    return { count };
  }

  async #add(voter: User, resource: Resource, upvote: boolean) {
    await this.#ready();
    try {
      await this.votes.insertOne({ voter, resource, upvote });
    } catch (error) {
      if (isDuplicate(error)) throw new AlreadyVoted("You already have a vote on this.");
      throw error;
    }
  }
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;
