# GeographicPosting

## Purpose

Allow users to create posts associated with physical locations to be displayed publicly.

## Principle

Users create posts with text content and a GPS coordinate. They can then be deleted or edited by the author.

## Types

```types
external User
  Whoever authors a post.

opaque Coordinate
  A GPS position. The representation is a latitude and longitude.
```

## State

```state
a set of Posts with
  a body String
  an author User
  a location Coordinate

Rule: a location is a GPS coordinate whose latitude is in [-90, 90] and whose longitude is in [-180, 180].
```

## Actions

```actions
post(user: User, body: String, location: Coordinate) : returns (post: Post)
  where body is empty
  then
    refuses EMPTY_BODY "A post needs some text."
  where location is not a valid coordinate
  then
    refuses INVALID_LOCATION "That location is not a valid GPS coordinate."
  where body is nonempty and location is a valid coordinate
  then
    add a post with body, location, and author user
    returns post

delete(user: User, post: Post) : returns (post: Post)
  where post is unknown
  then
    refuses POST_NOT_FOUND "There is no such post."
  where user is not the post's author
  then
    refuses NOT_AUTHOR "Only the author can change this post."
  where post exists and user is the author
  then
    remove post
    returns post

edit(user: User, post: Post, body: String) : returns (post: Post)
  where post is unknown
  then
    refuses POST_NOT_FOUND "There is no such post."
  where user is not the post's author
  then
    refuses NOT_AUTHOR "Only the author can change this post."
  where body is empty
  then
    refuses EMPTY_BODY "A post needs some text."
  where post exists, user is the author, and body is nonempty
  then
    overwrite the post's body
    returns post
```

## Queries

```queries
_allPosts() : many (post: Post, body: String, author: User, location: Coordinate)
  Returns every post, or no rows when there are none. The order of the rows is unspecified.
```
