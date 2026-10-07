# Concepts
## Table of contents
- C1:  [EmailAndPasswordAuthenticating](##EmailAndPasswordAuthenticating)
- C2: [GeographicPosting](##Commenting)
- C3: [Labeling](##Labeling)
- C4: [Upvoting](##Upvoting)
- C5: [Querying](##Querying)
- [Notes](##Notes)

## EmailAndPasswordAuthenticating
*Note: taken from my submission to E2*
### Purpose
Identify users; prevent one user from masquerading as another; collect active emails from users for future notifications or password renewals
### Principle
After a user registers with an email, username, and a password, they recieve a secret token in their inbox. They finalize their account registration by confirming with their username and secret token. They can then authenticate with that same username and password and be treated each time as the same user.
### State
- a set of Users with a `username: string`, `password: string`, `email: string`, and `verified: boolean`
- a set of Tokens with a `username: string`
### Actions
#### `register (username: string, password: string, email: string) : return (user: User, secret: Token)`
- **where** both `username` and `email` are unused by any user in the set of all users, all arguments are nonempty, and `email` is a valid email
- **then** create a new user with the given `username` and `password`, `verified` set to false, and return it; create a new token with the newly created user, and return it (via email or some other reaction)

#### `confirm(username: String, secret: Token)`
- **where** the `secret` argument is contained within the set of all tokens, and the stored token's username matches the `username` argument
- **then** set the `verified` flag of the that user to true

#### `authenticate (username: string, password: string) : return (user: User)`
- **where** there exists a user with username `username` in the set of all users, and its password matches the `password` argument, and its `verified` flag is true
- **then** return that user


## GeographicPosting
### Purpose
Allow users to write notes about physical locations to be displayed publicly
### Principle
Users create posts with text content and a GPS coordinate. They can then be deleted or edited by the author.
### State
- a set of Posts with a body String and author User
### Actions
#### create(user: User, body: String, location: Coordinate) : Post
- **where**: user exists 
- **then**: add a post with the arguments and return it
#### delete(post: Post)
- **where**: post exists
- **then**: delete it
#### edit(user: User, post: Post, body: Body)
- **where**: post exists and user is the author
- **then**: overwrite that post's body


## Labeling[Resource]
### Purpose
Group related resources under a shared tag
### Principle
After a tag is applied to a resource, all resources under a shared tag can be queried at once. Tags can also be unapplied.
### State
- a set of Labels with a set of Resources
### Actions
#### createLabel(label: Label)
- **where**: label does not exist
- **then**: create it
#### applyLabel(label: Label, resource: Resource)
- **where**: label and resource exist; resource not in label group
- **then**: add resources to the label group
#### removeLabel(label: Label, resource: Resource)
- **where**: label and resource exist; resource in label group
- **then**: add resources to the label group
#### _getResourcesUnderLabel(label: Label) : a set of Resources
- **where**: label exists
- **then**: return the set of all resources with that label
#### delete
- **where**: label exists
- **then**: delete the label 

## Upvoting[Resource]
### Purpose
Rank the quality of user contributions
### Principle
Resources (i.e. posts, comments) can be upvoted/downvoted, or unvoted to undo
### State
- a set of Votes with a Resource, a voter User, and a boolean flag for upvote/downvote
### Actions
#### upvote(vote: User, resource: Resource)
- **where**: a vote does not exist with the  user and resource
- **then**: add a new Vote with the given user + resource and upvote flagged as true
#### downvote(vote: User, resource: Resource)
- **where**: a vote does not exist with the  user and resource
- **then**: add a new Vote with the given user + resource and upvote flagged as false
#### unvote(voter: User, resource: Resource)
- **where**: a vote exists with the voter and resource
- **then**: delete the vote
#### _getVoteCount(resource: Resource)
- **then**: return the count of all upvotes with the resource minus the downvotes

## Querying[Resource]
### Purpose
Isolate relevant resources out of a larger collection;
### Principle
Resources are indexed and unindexed into a SearchContext. A list of resources can then be queried according to the rules of SearchAlgorithm.
### State
- a set of SearchContexts with a set of Resources
- a set of SearchAlgorithms
### Actions
#### registerAlgorithm(algorithm: SearchAlgorithm)
- **where**: algorithm is not already registered
- **then**: register it
#### createContext(context: SearchContext)
- **where**: context does not already exist
- **then**: create it
#### index(resource: Resource, context: SearchContext)
- **where**: resource and context both exist; resources not already in context
- **then**: add resource to context 
#### unindex(resource: Resource, context: SearchContext)
- **where**: resource and context both exist; resource in context
- **then**: remove resource from context
#### _getNResults(context: SearchContext, algorithm: SearchAlgorithm, resultCount: number) : a set of Resources
- **where**: all arguments exist, resultCount >= 0
- **then**: return resultCount amount of resources according to the ranking rules of algorithm

# Reactions
## PostIndexing (creation, but analagous reaction for edit/delete)
- **when** GeographicPosting.create() : (post: Post)
- **then** Querying.index(post)
## AccessGating
- **when** Requesting.[any GeographicPosting or Upvoting action is requested]
- **where** user is authenticated (EmailAndPasswordAuthenticating)
- **then** complete the action

## Self-explanatory but necessary reactions:
- De-indexing comments when they are deleted
- Deleting comments when their location is deleted

# Notes
- I didn't explicitly write the indexing reactions when a post is edited or deleted for brevity, but they would be necessary in addition to the creation reaction.
- Querying has a modular "SearchAlgorithm" type for ranking results. This could be its own concept (e.g. ItemRanking), but I decided to simplify it because this type will ideally be a small implementation of an existing algorithm, such as string similarity.
- The Labeling concept will be used for saving sticky notes. I decided to generalize it in order to implement less important features like grouping notes under a specific place (e.g. all Harvard notes are under one label).