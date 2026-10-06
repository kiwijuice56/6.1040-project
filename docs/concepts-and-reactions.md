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
...
### State
...
### Actions
#### create
- **where**:
- **then**: 
#### delete
- **where**:
- **then**: 
#### edit
- **where**:
- **then**: 


## Labeling[Resource]
### Purpose
Make it easier to parse groups of related resources;
### Principle
Users can add or remove any number of alphanumeric tags to resources. They can then query for resources by tag.
### State
...
### Actions
#### index
- **where**:
- **then**: 
#### _findTopResults
- **where**:
- **then**: 
#### delete
- **where**:
- **then**: 

## Upvoting[Subject]
### Purpose
Rank the quality of user contributions
### Principle
Subjects (i.e. posts, comments) can be upvoted/downvoted, or unvoted to undo
### State
- a set of Votes with a Subject, a voter User, and a boolean flag for upvote/downvote
### Actions
#### upvote(vote: User, subject: Subject)
- **where**: a vote does not exist with the  user and subject
- **then**: add a new Vote with the given user + subject and upvote flagged as true
#### downvote(vote: User, subject: Subject)
- **where**: a vote does not exist with the  user and subject
- **then**: add a new Vote with the given user + subject and upvote flagged as false
#### unvote(voter: User, subject: Subject)
- **where**: a vote exists with the voter and subject
- **then**: delete the vote
#### _getVoteCount(subject: Subject)
- **then**: return the count of all upvotes with the subject minus the downvotes

## Querying
### Purpose
Isolate relevant resources out of a larger collection;
### Principle
...
### State
...
### Actions
#### index
- **where**:
- **then**: 
#### _findTopResults
- **where**:
- **then**: 
#### delete
- **where**:
- **then**: 



# Reactions
## CommentIndexing
TODO: when comments posted, index them
## CommentBinding
TODO: before/while comments posted, bind them to user-provided location and GPS coordinates
## CommentFiltering
TODO: when comment down voted too low, delete it
## Self-explanatory but necessary reactions:
- De-indexing comments when they are deleted
- Deleting comments when their location is deleted

# Notes
- The reason that GeographicBinding is its own concept is because it could be applied to both comments 