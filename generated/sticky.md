<!-- Generated from the Sticky assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Sticky — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

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

- `Consenting` — instance of `Consenting` — [Sticky types](../design/types.md), line 21.
  - `Person` is `Registering.User` — [Sticky types](../design/types.md), line 22.
  - `Use` is `Feature` — [Sticky types](../design/types.md), line 23.

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

- `CommonsFederating` — instance of `Federating` — [Sticky types](../design/types.md), line 15.
  - `User` is `Registering.User` — [Sticky types](../design/types.md), line 16.

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

#### Instances

- `GeographicPosting` — instance of `GeographicPosting` — [Sticky types](../design/types.md), line 25.
  - `User` is `Registering.User` — [Sticky types](../design/types.md), line 26.

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

- `Registering` — instance of `Registering` — [Sticky types](../design/types.md), line 13.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `use(session: Session) : returns (subject: Subject)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.
- `end(session: Session) : returns (session: Session)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.

#### Instances

- `Sessioning` — instance of `Sessioning` — [Sticky types](../design/types.md), line 18.
  - `Subject` is `Registering.User` — [Sticky types](../design/types.md), line 19.

## Application types

Concrete types:

- `Feature` — [Sticky types](../design/types.md), line 8.

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

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/commons/choose` — requires `attempt`, `username`
- `/auth/commons/finish` — requires `attempt`, `code`, `state`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/posts/create` — requires `body`, `location`, `session`
