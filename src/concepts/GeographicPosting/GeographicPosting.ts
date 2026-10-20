import type { Collection, Db } from "mongodb";
import { haversineMiles } from "../../geo.ts";

export class EmptyBody extends Error {}
export class InvalidLocation extends Error {}
export class PostNotFound extends Error {}
export class NotAuthor extends Error {}

export type Post = string & { readonly __brand: "Post" };

/** A GPS position. This concept stores the pair; it does not use a geometry library. */
export type Coordinate = {
  latitude: number;
  longitude: number;
};

interface PostDocument<User> {
  _id: Post;
  body: string;
  author: User;
  location: Coordinate;
}

function isValidCoordinate(location: Coordinate) {
  return (
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

/** Allow users to create posts associated with physical locations to be displayed publicly. */
export class GeographicPostingConcept<User extends string> {
  private readonly posts: Collection<PostDocument<User>>;

  constructor(database: Db, name = "GeographicPosting") {
    this.posts = database.collection(`${name.toLowerCase()}.posts`);
  }

  async post({ user, body, location }: { user: User; body: string; location: Coordinate }) {
    if (body.trim() === "") throw new EmptyBody("A post needs some text.");
    if (!isValidCoordinate(location)) throw new InvalidLocation("That location is not a valid GPS coordinate.");
    const post = crypto.randomUUID() as Post;
    await this.posts.insertOne({ _id: post, body, author: user, location });
    return { post };
  }

  async delete({ user, post }: { user: User; post: Post }) {
    const found = await this.posts.findOne({ _id: post });
    if (found === null) throw new PostNotFound("There is no such post.");
    if (found.author !== user) throw new NotAuthor("Only the author can change this post.");
    await this.posts.deleteOne({ _id: post });
    return { post };
  }

  async edit({ user, post, body }: { user: User; post: Post; body: string }) {
    const found = await this.posts.findOne({ _id: post });
    if (found === null) throw new PostNotFound("There is no such post.");
    if (found.author !== user) throw new NotAuthor("Only the author can change this post.");
    if (body.trim() === "") throw new EmptyBody("A post needs some text.");
    await this.posts.updateOne({ _id: post }, { $set: { body } });
    return { post };
  }

  async _allPosts(_input: Record<string, never> = {}) {
    const rows = await this.posts.find().toArray();
    return rows.map(({ _id, body, author, location }) => ({ post: _id, body, author, location }));
  }

  async _post({ post }: { post: Post }) {
    const found = await this.posts.findOne({ _id: post });
    return found === null ? [] : [{ body: found.body, author: found.author, location: found.location }];
  }

  async _postsNear({ location, miles }: { location: Coordinate; miles: number }) {
    if (!isValidCoordinate(location) || !Number.isFinite(miles) || miles <= 0) return [];
    const rows = await this.posts.find().toArray();
    return rows
      .filter((row) => haversineMiles(location, row.location) <= miles)
      .map(({ _id, body, author, location: at }) => ({ post: _id, body, author, location: at }));
  }
}
