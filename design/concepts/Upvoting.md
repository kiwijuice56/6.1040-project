# Upvoting

## Purpose

Record each person's approval or disapproval of a contribution so contributions can be ranked.

*Prevents:* a person records more than one vote on the same contribution; a downvote is counted as an upvote; votes remain after the contribution is gone.

## Principle

Resources (i.e. posts, comments) can be upvoted/downvoted, or unvoted to undo. The total vote count (upvotes - downvotes) can be queried for each resource.

## Types

```types
external Resource
  The contribution being ranked.

external User
  Whoever records a vote.
```

## State

```state
a set of Votes with
  a Resource
  a voter User
  an upvote Flag
  unique voter and resource
```

## Actions

```actions
upvote(voter: User, resource: Resource) : returns (resource: Resource)
  where a vote already has this voter and resource
  then
    refuses ALREADY_VOTED "You already have a vote on this."
  where no vote has this voter and resource
  then
    add a vote with voter, resource, and upvote true
    returns resource

downvote(voter: User, resource: Resource) : returns (resource: Resource)
  where a vote already has this voter and resource
  then
    refuses ALREADY_VOTED "You already have a vote on this."
  where no vote has this voter and resource
  then
    add a vote with voter, resource, and upvote false
    returns resource

unvote(voter: User, resource: Resource) : returns (resource: Resource)
  where no vote has this voter and resource
  then
    refuses NO_VOTE "You have not voted on this."
  where a vote has this voter and resource
  then
    remove that vote
    returns resource

clearAllVotes(resource: Resource) : returns (resource: Resource)
  where true
  then
    remove every vote whose resource is this resource
    returns resource
```

## Queries

```queries
_getVoteCount(resource: Resource) : one (count: Number)
  Returns the number of upvotes for the resource minus the number of downvotes. When there are no votes, the count is 0.
```
