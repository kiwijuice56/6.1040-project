<!-- Generated from the Sticky assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Sticky — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `set(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_PASSWORD`: A password must have 8 to 128 characters.
  - Refuses `PASSWORD_SET`: This account already has a password.
- `authenticate(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_acceptable(password: String) : one (acceptable: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [Sticky types](../design/types.md), line 23.
  - `User` is `Registering.User` — [Sticky types](../design/types.md), line 24.

### Consenting

Defined in [Consenting](../design/concepts/Consenting.md), line 1.

#### Actions

- `consent(person: Person, use: Use) : returns (person: Person, use: Use)`
  - Refuses `ALREADY_CONSENTED`: You have already consented to this.
- `withdraw(person: Person, use: Use) : returns (person: Person, use: Use)`
  - Refuses `NOT_CONSENTED`: You haven't consented to this.

#### Queries

- `_consented(person: Person, use: Use) : one (consented: Flag)`

#### Instances

- `Consenting` — instance of `Consenting` — [Sticky types](../design/types.md), line 29.
  - `Person` is `Registering.User` — [Sticky types](../design/types.md), line 30.
  - `Use` is `Feature` — [Sticky types](../design/types.md), line 31.

### Federating

Defined in [Federating](../design/concepts/Federating.md), line 1.

#### Actions

- `start() : returns (attempt: Attempt, expiresAt: DateTime, address: String)`
- `finish(attempt: Attempt, nonce: String, code: String) : returns (username: String)`
  - Refuses `SIGN_IN_EXPIRED`: This sign-in has expired. Start again.
  - Refuses `SIGN_IN_REFUSED`: The other site didn't confirm this sign-in. Start again.
- `link(attempt: Attempt, user: User) : returns (user: User)`
  - Refuses `NOT_CONFIRMED`: This sign-in hasn't been confirmed.
  - Refuses `ALREADY_LINKED`: This account on the other site is already linked.

#### Queries

- `_user(attempt: Attempt) : optional (user: User)`
- `_linkable(attempt: Attempt) : one (linkable: Flag)`

#### Instances

- `CommonsFederating` — instance of `Federating` — [Sticky types](../design/types.md), line 20.
  - `User` is `Registering.User` — [Sticky types](../design/types.md), line 21.

### GeographicPosting

Defined in [GeographicPosting](../design/concepts/GeographicPosting.md), line 1.

#### Actions

- `post(user: User, body: String, location: Coordinate) : returns (post: Post)`
  - Refuses `EMPTY_BODY`: A post needs some text.
  - Refuses `INVALID_LOCATION`: That location is not a valid GPS coordinate.
- `delete(user: User, post: Post) : returns (post: Post)`
  - Refuses `POST_NOT_FOUND`: There is no such post.
  - Refuses `NOT_AUTHOR`: Only the author can change this post.
- `edit(user: User, post: Post, body: String) : returns (post: Post)`
  - Refuses `POST_NOT_FOUND`: There is no such post.
  - Refuses `NOT_AUTHOR`: Only the author can change this post.
  - Refuses `EMPTY_BODY`: A post needs some text.

#### Queries

- `_allPosts() : many (post: Post, body: String, author: User, location: Coordinate)`
- `_post(post: Post) : optional (body: String, author: User, location: Coordinate)`
- `_postsNear(location: Coordinate, miles: Number) : many (post: Post, body: String, author: User, location: Coordinate)`

#### Instances

- `GeographicPosting` — instance of `GeographicPosting` — [Sticky types](../design/types.md), line 33.
  - `User` is `Registering.User` — [Sticky types](../design/types.md), line 34.

### Labeling

Defined in [Labeling](../design/concepts/Labeling.md), line 1.

#### Actions

- `createLabel() : returns (label: Label)`
- `ensure(label: Label) : returns (label: Label)`
- `applyLabel(label: Label, resource: Resource) : returns (resource: Resource)`
  - Refuses `LABEL_NOT_FOUND`: There is no such label.
  - Refuses `ALREADY_LABELED`: That resource already has this label.
- `removeLabel(label: Label, resource: Resource) : returns (resource: Resource)`
  - Refuses `LABEL_NOT_FOUND`: There is no such label.
  - Refuses `NOT_LABELED`: That resource does not have this label.
- `delete(label: Label) : returns (label: Label)`
  - Refuses `LABEL_NOT_FOUND`: There is no such label.
- `unlabelEverywhere(resource: Resource) : returns (resource: Resource)`

#### Queries

- `_resources(label: Label) : many (resource: Resource)`
- `_labels(resource: Resource) : many (label: Label)`
- `_has(label: Label, resource: Resource) : optional (resource: Resource)`
- `_label(label: Label) : optional (label: Label)`

#### Instances

- `Labeling` — instance of `Labeling` — [Sticky types](../design/types.md), line 44.
  - `Resource` is `GeographicPosting.Post` — [Sticky types](../design/types.md), line 45.

### Querying

Defined in [Querying](../design/concepts/Querying.md), line 1.

#### Actions

- `createContext() : returns (context: SearchContext)`
- `index(context: SearchContext, resource: Resource, document: String) : returns (resource: Resource)`
  - Refuses `CONTEXT_NOT_FOUND`: There is no such search.
  - Refuses `ALREADY_INDEXED`: That resource is already in this search.
- `unindex(context: SearchContext, resource: Resource) : returns (resource: Resource)`
  - Refuses `CONTEXT_NOT_FOUND`: There is no such search.
  - Refuses `NOT_INDEXED`: That resource is not in this search.
- `replace(context: SearchContext, bundle: Bundle) : returns (context: SearchContext)`
  - Refuses `CONTEXT_NOT_FOUND`: There is no such search.
  - Refuses `INVALID_BUNDLE`: That is not a list of documents to search.
- `discard(context: SearchContext) : returns (context: SearchContext)`
  - Refuses `CONTEXT_NOT_FOUND`: There is no such search.
- `unindexEverywhere(resource: Resource) : returns (resource: Resource)`
- `reindexEverywhere(resource: Resource, document: String) : returns (resource: Resource)`

#### Queries

- `_getNResults(context: SearchContext, algorithm: SearchAlgorithm, query: String, resultCount: Number) : many (resource: Resource, rank: Number)`
- `_indexed(context: SearchContext) : many (resource: Resource, document: String)`
- `_context(context: SearchContext) : optional (context: SearchContext)`

#### Instances

- `Querying` — instance of `Querying` — [Sticky types](../design/types.md), line 40.
  - `Resource` is `GeographicPosting.Post` — [Sticky types](../design/types.md), line 41.
  - `SearchAlgorithm` is `SearchAlgorithm` — [Sticky types](../design/types.md), line 42.

### Registering

Defined in [Registering](../design/concepts/Registering.md), line 1.

#### Actions

- `register(username: String) : returns (user: User)`
  - Refuses `INVALID_USERNAME`: A username must have 3 to 32 letters, digits, underscores, or hyphens.
  - Refuses `USERNAME_TAKEN`: That username is taken.

#### Queries

- `_byUsername(username: String) : optional (user: User)`
- `_username(user: User) : optional (username: String)`

#### Instances

- `Registering` — instance of `Registering` — [Sticky types](../design/types.md), line 18.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `use(session: Session) : returns (subject: Subject)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.
- `end(session: Session) : returns (session: Session)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.

#### Instances

- `Sessioning` — instance of `Sessioning` — [Sticky types](../design/types.md), line 26.
  - `Subject` is `Registering.User` — [Sticky types](../design/types.md), line 27.

### Upvoting

Defined in [Upvoting](../design/concepts/Upvoting.md), line 1.

#### Actions

- `upvote(voter: User, resource: Resource) : returns (resource: Resource)`
  - Refuses `ALREADY_VOTED`: You already have a vote on this.
- `downvote(voter: User, resource: Resource) : returns (resource: Resource)`
  - Refuses `ALREADY_VOTED`: You already have a vote on this.
- `unvote(voter: User, resource: Resource) : returns (resource: Resource)`
  - Refuses `NO_VOTE`: You have not voted on this.
- `clearAllVotes(resource: Resource) : returns (resource: Resource)`

#### Queries

- `_getVoteCount(resource: Resource) : one (count: Number)`
- `_getVote(voter: User, resource: Resource) : optional (upvote: Flag)`

#### Instances

- `Upvoting` — instance of `Upvoting` — [Sticky types](../design/types.md), line 36.
  - `Resource` is `GeographicPosting.Post` — [Sticky types](../design/types.md), line 38.
  - `User` is `Registering.User` — [Sticky types](../design/types.md), line 37.

## Application types

Concrete types:

- `Feature` — [Sticky types](../design/types.md), line 8.
- `SearchAlgorithm` — [Sticky types](../design/types.md), line 11.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the nearby documents

Authored path: `searching.covering.NearbyDocuments`.
- Covered by [Searching](../design/compositions/searching.md), line 3.

```former
Former "the nearby documents" — inputs (location, miles); bindings (post, body, author, at); promises exactly one record — forms:
  each GeographicPosting._postsNear (location, miles) has (author, body, location: at, post)
    form a record of
      document: body
      resource: post
```

### the public notes

Authored path: `posting.listing.AllNotes`.
- Covered by [Posting](../design/compositions/posting.md), line 9.

```former
Former "the public notes" — inputs (); bindings (post, body, author, location, username, count); promises exactly one record — forms:
  each GeographicPosting._allPosts () has (author, body, location, post)
    where whether Registering._username (user: author) has (username)
    where Upvoting._getVoteCount (resource: post) has (count)
    form a record of
      author
      body
      count
      location
      post
      username
```

### the ranked notes

Authored path: `searching.ranking.RankedNotes`.
- Covered by [Searching](../design/compositions/searching.md), line 16.

```former
Former "the ranked notes" — inputs (context, algorithm, query, resultCount); bindings (post, body, author, location, username, count, rank); promises exactly one record — forms:
  each Querying._getNResults (algorithm, context, query, resultCount) has (rank, resource: post)
    where GeographicPosting._post (post) has (author, body, location)
    where whether Registering._username (user: author) has (username)
    where Upvoting._getVoteCount (resource: post) has (count)
    arranged by rank, descending
    form a record of
      author
      body
      count
      location
      post
      username
```

### the saved notes

Authored path: `saving.listing.SavedNotes`.
- Covered by [Saving](../design/compositions/saving.md), line 15.

```former
Former "the saved notes" — inputs (label); bindings (post, body, author, location, username, count); promises exactly one record — forms:
  each Labeling._resources (label) has (resource: post)
    where GeographicPosting._post (post) has (author, body, location)
    where whether Registering._username (user: author) has (username)
    where Upvoting._getVoteCount (resource: post) has (count)
    form a record of
      author
      body
      count
      location
      post
      username
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### location.sharing.ConsentLocation

Authored path: `location.sharing.ConsentLocation`.
- Covered by [Sharing location](../design/compositions/location.md), line 5.
- Covered by [Sharing location](../design/compositions/location.md), line 8.

```reaction
when RequestBoundary.request (feature, path: "/location/consent", requestId, session)
then
  Sessioning.use (session)
```

### location.sharing.ConsentLocation#2

Authored path: `location.sharing.ConsentLocation`.
- Covered by [Sharing location](../design/compositions/location.md), line 5.
- Covered by [Sharing location](../design/compositions/location.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by location.sharing.ConsentLocation
where
  earlier, RequestBoundary.request (feature, path: "/location/consent", requestId, session)
then
  Consenting.consent (person: user, use: feature)
```

### location.sharing.ConsentLocation#3

Authored path: `location.sharing.ConsentLocation`.
- Covered by [Sharing location](../design/compositions/location.md), line 5.
- Covered by [Sharing location](../design/compositions/location.md), line 8.

```reaction
when Consenting.consent (person: user, use: feature), asked by location.sharing.ConsentLocation#2
where
  earlier, RequestBoundary.request (feature, path: "/location/consent", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### location.sharing.ReadLocationConsent

Authored path: `location.sharing.ReadLocationConsent`.
- Covered by [Sharing location](../design/compositions/location.md), line 17.
- Covered by [Sharing location](../design/compositions/location.md), line 20.

```reaction
when RequestBoundary.request (feature, path: "/location/status", requestId, session)
then
  Sessioning.use (session)
```

### location.sharing.ReadLocationConsent#2

Authored path: `location.sharing.ReadLocationConsent`.
- Covered by [Sharing location](../design/compositions/location.md), line 17.
- Covered by [Sharing location](../design/compositions/location.md), line 20.

```reaction
when Sessioning.use (session, subject: user), asked by location.sharing.ReadLocationConsent
where
  earlier, RequestBoundary.request (feature, path: "/location/status", requestId, session)
  Consenting._consented (person: user, use: feature) has (consented)
then
  RequestBoundary.respond (consented, requestId)
```

### location.sharing.WithdrawLocation

Authored path: `location.sharing.WithdrawLocation`.
- Covered by [Sharing location](../design/compositions/location.md), line 11.
- Covered by [Sharing location](../design/compositions/location.md), line 14.

```reaction
when RequestBoundary.request (feature, path: "/location/withdraw", requestId, session)
then
  Sessioning.use (session)
```

### location.sharing.WithdrawLocation#2

Authored path: `location.sharing.WithdrawLocation`.
- Covered by [Sharing location](../design/compositions/location.md), line 11.
- Covered by [Sharing location](../design/compositions/location.md), line 14.

```reaction
when Sessioning.use (session, subject: user), asked by location.sharing.WithdrawLocation
where
  earlier, RequestBoundary.request (feature, path: "/location/withdraw", requestId, session)
then
  Consenting.withdraw (person: user, use: feature)
```

### location.sharing.WithdrawLocation#3

Authored path: `location.sharing.WithdrawLocation`.
- Covered by [Sharing location](../design/compositions/location.md), line 11.
- Covered by [Sharing location](../design/compositions/location.md), line 14.

```reaction
when Consenting.withdraw (person: user, use: feature), asked by location.sharing.WithdrawLocation#2
where
  earlier, RequestBoundary.request (feature, path: "/location/withdraw", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### posting.changing.DeletePost

Authored path: `posting.changing.DeletePost`.
- Covered by [Posting](../design/compositions/posting.md), line 15.
- Covered by [Posting](../design/compositions/posting.md), line 19.

```reaction
when RequestBoundary.request (path: "/posts/delete", post, requestId, session)
then
  Sessioning.use (session)
```

### posting.changing.DeletePost#2

Authored path: `posting.changing.DeletePost`.
- Covered by [Posting](../design/compositions/posting.md), line 15.
- Covered by [Posting](../design/compositions/posting.md), line 19.

```reaction
when Sessioning.use (session, subject: user), asked by posting.changing.DeletePost
where
  earlier, RequestBoundary.request (path: "/posts/delete", post, requestId, session)
then
  GeographicPosting.delete (post, user)
```

### posting.changing.DeletePost#3

Authored path: `posting.changing.DeletePost`.
- Covered by [Posting](../design/compositions/posting.md), line 15.
- Covered by [Posting](../design/compositions/posting.md), line 19.

```reaction
when GeographicPosting.delete (post, user), asked by posting.changing.DeletePost#2
then
  Upvoting.clearAllVotes (resource: post)
```

### posting.changing.DeletePost#4

Authored path: `posting.changing.DeletePost`.
- Covered by [Posting](../design/compositions/posting.md), line 15.
- Covered by [Posting](../design/compositions/posting.md), line 19.

```reaction
when Upvoting.clearAllVotes (resource: post), asked by posting.changing.DeletePost#3
where
  earlier, RequestBoundary.request (path: "/posts/delete", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### posting.changing.EditPost

Authored path: `posting.changing.EditPost`.
- Covered by [Posting](../design/compositions/posting.md), line 15.
- Covered by [Posting](../design/compositions/posting.md), line 18.

```reaction
when RequestBoundary.request (body, path: "/posts/edit", post, requestId, session)
then
  Sessioning.use (session)
```

### posting.changing.EditPost#2

Authored path: `posting.changing.EditPost`.
- Covered by [Posting](../design/compositions/posting.md), line 15.
- Covered by [Posting](../design/compositions/posting.md), line 18.

```reaction
when Sessioning.use (session, subject: user), asked by posting.changing.EditPost
where
  earlier, RequestBoundary.request (body, path: "/posts/edit", post, requestId, session)
then
  GeographicPosting.edit (body, post, user)
```

### posting.changing.EditPost#3

Authored path: `posting.changing.EditPost`.
- Covered by [Posting](../design/compositions/posting.md), line 15.
- Covered by [Posting](../design/compositions/posting.md), line 18.

```reaction
when GeographicPosting.edit (body, post, user), asked by posting.changing.EditPost#2
where
  earlier, RequestBoundary.request (body, path: "/posts/edit", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### posting.creating.CreatePost

Authored path: `posting.creating.CreatePost`.
- Covered by [Posting](../design/compositions/posting.md), line 3.
- Covered by [Posting](../design/compositions/posting.md), line 6.

```reaction
when RequestBoundary.request (body, location, path: "/posts/create", requestId, session)
then
  Sessioning.use (session)
```

### posting.creating.CreatePost#2

Authored path: `posting.creating.CreatePost`.
- Covered by [Posting](../design/compositions/posting.md), line 3.
- Covered by [Posting](../design/compositions/posting.md), line 6.

```reaction
when Sessioning.use (session, subject: user), asked by posting.creating.CreatePost
where
  earlier, RequestBoundary.request (body, location, path: "/posts/create", requestId, session)
then
  GeographicPosting.post (body, location, user)
```

### posting.creating.CreatePost#3

Authored path: `posting.creating.CreatePost`.
- Covered by [Posting](../design/compositions/posting.md), line 3.
- Covered by [Posting](../design/compositions/posting.md), line 6.

```reaction
when GeographicPosting.post (body, location, user, post), asked by posting.creating.CreatePost#2
where
  earlier, RequestBoundary.request (body, location, path: "/posts/create", requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### posting.listing.ListPosts

Authored path: `posting.listing.ListPosts`.
- Covered by [Posting](../design/compositions/posting.md), line 9.
- Covered by [Posting](../design/compositions/posting.md), line 12.

```reaction
when RequestBoundary.request (path: "/posts/list", requestId)
then
  RequestBoundary.respond (posts: former "the public notes", requestId)
```

### posting.ranking.DownvotePost

Authored path: `posting.ranking.DownvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 26.

```reaction
when RequestBoundary.request (path: "/posts/downvote", post, requestId, session)
then
  Sessioning.use (session)
```

### posting.ranking.DownvotePost#2

Authored path: `posting.ranking.DownvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 26.

```reaction
when Sessioning.use (session, subject: user), asked by posting.ranking.DownvotePost
where
  earlier, RequestBoundary.request (path: "/posts/downvote", post, requestId, session)
then
  Upvoting.downvote (resource: post, voter: user)
```

### posting.ranking.DownvotePost#3

Authored path: `posting.ranking.DownvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 26.

```reaction
when Upvoting.downvote (resource: post, voter: user), asked by posting.ranking.DownvotePost#2
where
  earlier, RequestBoundary.request (path: "/posts/downvote", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### posting.ranking.ReadVote

Authored path: `posting.ranking.ReadVote`.
- Covered by [Posting](../design/compositions/posting.md), line 30.
- Covered by [Posting](../design/compositions/posting.md), line 33.

```reaction
when RequestBoundary.request (path: "/posts/vote", post, requestId, session)
then
  Sessioning.use (session)
```

### posting.ranking.ReadVote:none#2

Authored path: `posting.ranking.ReadVote`.
- Covered by [Posting](../design/compositions/posting.md), line 30.
- Covered by [Posting](../design/compositions/posting.md), line 33.

```reaction
when Sessioning.use (session, subject: user), asked by posting.ranking.ReadVote
where
  earlier, RequestBoundary.request (path: "/posts/vote", post, requestId, session)
  no Upvoting._getVote (resource: post, voter: user)
then
  RequestBoundary.respond (requestId)
```

### posting.ranking.ReadVote:voted#2

Authored path: `posting.ranking.ReadVote`.
- Covered by [Posting](../design/compositions/posting.md), line 30.
- Covered by [Posting](../design/compositions/posting.md), line 33.

```reaction
when Sessioning.use (session, subject: user), asked by posting.ranking.ReadVote
where
  earlier, RequestBoundary.request (path: "/posts/vote", post, requestId, session)
  Upvoting._getVote (resource: post, voter: user) has (upvote)
then
  RequestBoundary.respond (requestId, upvote)
```

### posting.ranking.UnvotePost

Authored path: `posting.ranking.UnvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 27.

```reaction
when RequestBoundary.request (path: "/posts/unvote", post, requestId, session)
then
  Sessioning.use (session)
```

### posting.ranking.UnvotePost#2

Authored path: `posting.ranking.UnvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 27.

```reaction
when Sessioning.use (session, subject: user), asked by posting.ranking.UnvotePost
where
  earlier, RequestBoundary.request (path: "/posts/unvote", post, requestId, session)
then
  Upvoting.unvote (resource: post, voter: user)
```

### posting.ranking.UnvotePost#3

Authored path: `posting.ranking.UnvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 27.

```reaction
when Upvoting.unvote (resource: post, voter: user), asked by posting.ranking.UnvotePost#2
where
  earlier, RequestBoundary.request (path: "/posts/unvote", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### posting.ranking.UpvotePost

Authored path: `posting.ranking.UpvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 25.

```reaction
when RequestBoundary.request (path: "/posts/upvote", post, requestId, session)
then
  Sessioning.use (session)
```

### posting.ranking.UpvotePost#2

Authored path: `posting.ranking.UpvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 25.

```reaction
when Sessioning.use (session, subject: user), asked by posting.ranking.UpvotePost
where
  earlier, RequestBoundary.request (path: "/posts/upvote", post, requestId, session)
then
  Upvoting.upvote (resource: post, voter: user)
```

### posting.ranking.UpvotePost#3

Authored path: `posting.ranking.UpvotePost`.
- Covered by [Posting](../design/compositions/posting.md), line 22.
- Covered by [Posting](../design/compositions/posting.md), line 25.

```reaction
when Upvoting.upvote (resource: post, voter: user), asked by posting.ranking.UpvotePost#2
where
  earlier, RequestBoundary.request (path: "/posts/upvote", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### reusable.accounts.identifying.Me

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when RequestBoundary.request (path: "/auth/me", requestId, session)
then
  Sessioning.use (session)
```

### reusable.accounts.identifying.Me#2

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by reusable.accounts.identifying.Me
where
  Registering._username (user) has (username)
  earlier, RequestBoundary.request (path: "/auth/me", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### reusable.accounts.leaving.SignOut

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Sessioning.end (session)
```

### reusable.accounts.leaving.SignOut#2

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when Sessioning.end (session), asked by reusable.accounts.leaving.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### reusable.commons.finishing.ChooseUsername:expired

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
where
  CommonsFederating._linkable (attempt) has (linkable: false)
then
  RequestBoundary.respond (error: "SIGN_IN_EXPIRED", requestId)
```

### reusable.commons.finishing.ChooseUsername:linkable

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
where
  CommonsFederating._linkable (attempt) has (linkable: true)
then
  Registering.register (username)
```

### reusable.commons.finishing.ChooseUsername:linkable#2

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when Registering.register (username, user), asked by reusable.commons.finishing.ChooseUsername:linkable
where
  earlier, RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
then
  CommonsFederating.link (attempt, user)
```

### reusable.commons.finishing.ChooseUsername:linkable#3

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when CommonsFederating.link (attempt, user), asked by reusable.commons.finishing.ChooseUsername:linkable#2
then
  Sessioning.start (subject: user)
```

### reusable.commons.finishing.ChooseUsername:linkable#4

Authored path: `reusable.commons.finishing.ChooseUsername`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 22.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 26.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.commons.finishing.ChooseUsername:linkable#3
where
  earlier, RequestBoundary.request (attempt, path: "/auth/commons/choose", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.commons.finishing.FinishCommons

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  CommonsFederating.finish (attempt, code, nonce: state)
```

### reusable.commons.finishing.FinishCommons:new#2

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when CommonsFederating.finish (attempt, code, nonce: state, username), asked by reusable.commons.finishing.FinishCommons
where
  no CommonsFederating._user (attempt)
then
  Registering.register (username)
```

### reusable.commons.finishing.FinishCommons:new#3

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when Registering.register (username, user), asked by reusable.commons.finishing.FinishCommons:new#2
where
  earlier, CommonsFederating.finish (attempt, code, nonce: state, username), asked by reusable.commons.finishing.FinishCommons
then
  CommonsFederating.link (attempt, user)
```

### reusable.commons.finishing.FinishCommons:new#4

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when CommonsFederating.link (attempt, user), asked by reusable.commons.finishing.FinishCommons:new#3
then
  Sessioning.start (subject: user)
```

### reusable.commons.finishing.FinishCommons:new#5

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.commons.finishing.FinishCommons:new#4
where
  earlier, RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.commons.finishing.FinishCommons:returning#2

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when CommonsFederating.finish (attempt, code, nonce: state, username), asked by reusable.commons.finishing.FinishCommons
where
  CommonsFederating._user (attempt) has (user)
then
  Sessioning.start (subject: user)
```

### reusable.commons.finishing.FinishCommons:returning#3

Authored path: `reusable.commons.finishing.FinishCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 15.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 25.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.commons.finishing.FinishCommons:returning#2
where
  earlier, RequestBoundary.request (attempt, code, path: "/auth/commons/finish", requestId, state)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.commons.starting.StartCommons

Authored path: `reusable.commons.starting.StartCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 7.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 10.

```reaction
when RequestBoundary.request (path: "/auth/commons/start", requestId)
then
  CommonsFederating.start ()
```

### reusable.commons.starting.StartCommons#2

Authored path: `reusable.commons.starting.StartCommons`.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 7.
- Covered by [Signing in with Commons](../design/compositions/reusable/commons.md), line 10.

```reaction
when CommonsFederating.start (address, attempt, expiresAt), asked by reusable.commons.starting.StartCommons
where
  earlier, RequestBoundary.request (path: "/auth/commons/start", requestId)
then
  RequestBoundary.respond (address, attempt, expiresAt, requestId)
```

### reusable.passwords.entering.Register:accepted

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: true)
then
  Registering.register (username)
```

### reusable.passwords.entering.Register:accepted#2

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Registering.register (username, user), asked by reusable.passwords.entering.Register:accepted
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.set (password, user)
```

### reusable.passwords.entering.Register:accepted#3

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Authenticating.set (password, user), asked by reusable.passwords.entering.Register:accepted#2
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.Register:accepted#4

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.Register:accepted#3
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.Register:refused

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: false)
then
  RequestBoundary.respond (error: "INVALID_PASSWORD", requestId)
```

### reusable.passwords.entering.SignIn:known

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  Registering._byUsername (username) has (user)
then
  Authenticating.authenticate (password, user)
```

### reusable.passwords.entering.SignIn:known#2

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Authenticating.authenticate (password, user), asked by reusable.passwords.entering.SignIn:known
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.SignIn:known#3

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.SignIn:known#2
where
  earlier, RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.SignIn:unknown

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  no Registering._byUsername (username)
then
  RequestBoundary.respond (error: "INVALID_CREDENTIALS", requestId)
```

### saving.keeping.SaveNote

Authored path: `saving.keeping.SaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 3.
- Covered by [Saving](../design/compositions/saving.md), line 6.

```reaction
when RequestBoundary.request (path: "/saves/save", post, requestId, session)
then
  Sessioning.use (session)
```

### saving.keeping.SaveNote#2

Authored path: `saving.keeping.SaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 3.
- Covered by [Saving](../design/compositions/saving.md), line 6.

```reaction
when Sessioning.use (session, subject: user), asked by saving.keeping.SaveNote
where
  Registering._username (user) has (username)
then
  Labeling.ensure (label: username)
```

### saving.keeping.SaveNote#3

Authored path: `saving.keeping.SaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 3.
- Covered by [Saving](../design/compositions/saving.md), line 6.

```reaction
when Labeling.ensure (label: username, result.label), asked by saving.keeping.SaveNote#2
where
  earlier, RequestBoundary.request (path: "/saves/save", post, requestId, session)
then
  Labeling.applyLabel (label, resource: post)
```

### saving.keeping.SaveNote#4

Authored path: `saving.keeping.SaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 3.
- Covered by [Saving](../design/compositions/saving.md), line 6.

```reaction
when Labeling.applyLabel (label, resource: post), asked by saving.keeping.SaveNote#3
where
  earlier, RequestBoundary.request (path: "/saves/save", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### saving.keeping.SaveOwnNote

Authored path: `saving.keeping.SaveOwnNote`.
- Covered by [Saving](../design/compositions/saving.md), line 21.

```reaction
when GeographicPosting.post (user, post)
where
  Registering._username (user) has (username)
then
  Labeling.ensure (label: username)
```

### saving.keeping.SaveOwnNote#2

Authored path: `saving.keeping.SaveOwnNote`.
- Covered by [Saving](../design/compositions/saving.md), line 21.

```reaction
when Labeling.ensure (label: username, result.label), asked by saving.keeping.SaveOwnNote
where
  earlier, GeographicPosting.post (user, post)
then
  Labeling.applyLabel (label, resource: post)
```

### saving.keeping.UnlabelDeletedNote

Authored path: `saving.keeping.UnlabelDeletedNote`.
- Covered by [Saving](../design/compositions/saving.md), line 21.

```reaction
when GeographicPosting.delete (post)
then
  Labeling.unlabelEverywhere (resource: post)
```

### saving.keeping.UnsaveNote

Authored path: `saving.keeping.UnsaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 9.
- Covered by [Saving](../design/compositions/saving.md), line 12.

```reaction
when RequestBoundary.request (path: "/saves/unsave", post, requestId, session)
then
  Sessioning.use (session)
```

### saving.keeping.UnsaveNote#2

Authored path: `saving.keeping.UnsaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 9.
- Covered by [Saving](../design/compositions/saving.md), line 12.

```reaction
when Sessioning.use (session, subject: user), asked by saving.keeping.UnsaveNote
where
  Registering._username (user) has (username)
then
  Labeling.ensure (label: username)
```

### saving.keeping.UnsaveNote#3

Authored path: `saving.keeping.UnsaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 9.
- Covered by [Saving](../design/compositions/saving.md), line 12.

```reaction
when Labeling.ensure (label: username, result.label), asked by saving.keeping.UnsaveNote#2
where
  earlier, RequestBoundary.request (path: "/saves/unsave", post, requestId, session)
then
  Labeling.removeLabel (label, resource: post)
```

### saving.keeping.UnsaveNote#4

Authored path: `saving.keeping.UnsaveNote`.
- Covered by [Saving](../design/compositions/saving.md), line 9.
- Covered by [Saving](../design/compositions/saving.md), line 12.

```reaction
when Labeling.removeLabel (label, resource: post), asked by saving.keeping.UnsaveNote#3
where
  earlier, RequestBoundary.request (path: "/saves/unsave", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### saving.listing.ListSaves

Authored path: `saving.listing.ListSaves`.
- Covered by [Saving](../design/compositions/saving.md), line 15.
- Covered by [Saving](../design/compositions/saving.md), line 18.

```reaction
when RequestBoundary.request (path: "/saves/list", requestId, session)
then
  Sessioning.use (session)
```

### saving.listing.ListSaves#2

Authored path: `saving.listing.ListSaves`.
- Covered by [Saving](../design/compositions/saving.md), line 15.
- Covered by [Saving](../design/compositions/saving.md), line 18.

```reaction
when Sessioning.use (session, subject: user), asked by saving.listing.ListSaves
where
  Registering._username (user) has (username)
  earlier, RequestBoundary.request (path: "/saves/list", requestId, session)
then
  RequestBoundary.respond (notes: former "the saved notes" with (label: username), requestId)
```

### searching.covering.ReplaceSearch

Authored path: `searching.covering.ReplaceSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 3.
- Covered by [Searching](../design/compositions/searching.md), line 7.

```reaction
when RequestBoundary.request (context, members, path: "/search/replace", requestId)
then
  Querying.replace (bundle: members, context)
```

### searching.covering.ReplaceSearch#2

Authored path: `searching.covering.ReplaceSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 3.
- Covered by [Searching](../design/compositions/searching.md), line 7.

```reaction
when Querying.replace (bundle: members, context), asked by searching.covering.ReplaceSearch
where
  earlier, RequestBoundary.request (context, members, path: "/search/replace", requestId)
then
  RequestBoundary.respond (context, requestId)
```

### searching.covering.SyncSearch

Authored path: `searching.covering.SyncSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 10.
- Covered by [Searching](../design/compositions/searching.md), line 13.

```reaction
when RequestBoundary.request (context, location, miles, path: "/search/sync", requestId)
where
  Querying._context (context) has (context)
then
  RequestBoundary.respond (context, members: former "the nearby documents" with (location, miles), requestId)
```

### searching.keeping.ReindexEditedNote

Authored path: `searching.keeping.ReindexEditedNote`.
- Covered by [Searching](../design/compositions/searching.md), line 23.

```reaction
when GeographicPosting.edit (body, post)
then
  Querying.reindexEverywhere (document: body, resource: post)
```

### searching.keeping.UnindexDeletedNote

Authored path: `searching.keeping.UnindexDeletedNote`.
- Covered by [Searching](../design/compositions/searching.md), line 23.

```reaction
when GeographicPosting.delete (post)
then
  Querying.unindexEverywhere (resource: post)
```

### searching.opening.CloseSearch

Authored path: `searching.opening.CloseSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 16.
- Covered by [Searching](../design/compositions/searching.md), line 20.

```reaction
when RequestBoundary.request (context, path: "/search/close", requestId)
then
  Querying.discard (context)
```

### searching.opening.CloseSearch#2

Authored path: `searching.opening.CloseSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 16.
- Covered by [Searching](../design/compositions/searching.md), line 20.

```reaction
when Querying.discard (context), asked by searching.opening.CloseSearch
where
  earlier, RequestBoundary.request (context, path: "/search/close", requestId)
then
  RequestBoundary.respond (requestId)
```

### searching.opening.OpenSearch

Authored path: `searching.opening.OpenSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 3.
- Covered by [Searching](../design/compositions/searching.md), line 6.

```reaction
when RequestBoundary.request (location, miles, path: "/search/open", requestId)
then
  Querying.createContext ()
```

### searching.opening.OpenSearch#2

Authored path: `searching.opening.OpenSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 3.
- Covered by [Searching](../design/compositions/searching.md), line 6.

```reaction
when Querying.createContext (context), asked by searching.opening.OpenSearch
where
  earlier, RequestBoundary.request (location, miles, path: "/search/open", requestId)
then
  RequestBoundary.respond (context, members: former "the nearby documents" with (location, miles), requestId)
```

### searching.ranking.RankSearch

Authored path: `searching.ranking.RankSearch`.
- Covered by [Searching](../design/compositions/searching.md), line 16.
- Covered by [Searching](../design/compositions/searching.md), line 19.

```reaction
when RequestBoundary.request (algorithm, context, path: "/search/query", query, requestId, resultCount)
then
  RequestBoundary.respond (notes: former "the ranked notes" with (algorithm, context, query, resultCount), requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/commons/choose` — requires `attempt`, `username`
- `/auth/commons/finish` — requires `attempt`, `code`, `state`
- `/auth/login` — requires `password`, `username`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/auth/register` — requires `password`, `username`
- `/location/consent` — requires `feature`, `session`
- `/location/status` — requires `feature`, `session`
- `/location/withdraw` — requires `feature`, `session`
- `/posts/create` — requires `body`, `location`, `session`
- `/posts/delete` — requires `post`, `session`
- `/posts/downvote` — requires `post`, `session`
- `/posts/edit` — requires `body`, `post`, `session`
- `/posts/unvote` — requires `post`, `session`
- `/posts/upvote` — requires `post`, `session`
- `/posts/vote` — requires `post`, `session`
- `/saves/list` — requires `session`
- `/saves/save` — requires `post`, `session`
- `/saves/unsave` — requires `post`, `session`
- `/search/close` — requires `context`
- `/search/open` — requires `location`, `miles`
- `/search/query` — requires `algorithm`, `context`, `query`, `resultCount`
- `/search/replace` — requires `context`, `members`
- `/search/sync` — requires `context`, `location`, `miles`
