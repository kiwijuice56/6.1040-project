# Posting

A signed-in person clicks the map and writes a note. The page posts the note's body and the click's GPS coordinate to the [create endpoint](reaction:posting.creating.CreatePost). That endpoint reads the user from the session with `Sessioning.use`, never from the request, then calls `GeographicPosting.post`. People who are not signed in are refused with `NOT_SIGNED_IN`.

```endpoints
posting.creating.CreatePost at /posts/create
```

Anyone can [read every note](reaction:posting.listing.ListPosts) using [the public notes](former:posting.listing.AllNotes): each GeographicPosting post's identity, body, author, location, the author's username from Registering, and the vote count from Upvoting. No session is required.

```endpoints
posting.listing.ListPosts at /posts/list
```

The author can [edit](reaction:posting.changing.EditPost) or [delete](reaction:posting.changing.DeletePost) a note. Each endpoint reads the user from the session with `Sessioning.use`, never from the request, then calls `GeographicPosting.edit` or `GeographicPosting.delete`. People who are not signed in are refused with `NOT_SIGNED_IN`. People who are not the author are refused with `NOT_AUTHOR`. After a delete succeeds, `Upvoting.clearAllVotes` removes every vote on that post. `clearAllVotes` is not an endpoint.

```endpoints
posting.changing.EditPost at /posts/edit
posting.changing.DeletePost at /posts/delete
```

A signed-in person can [upvote](reaction:posting.ranking.UpvotePost), [downvote](reaction:posting.ranking.DownvotePost), or [unvote](reaction:posting.ranking.UnvotePost) a note. Each endpoint reads the user from the session with `Sessioning.use`, never from the request — the same Registering user GeographicPosting uses as author — then calls Upvoting. The resource is the GeographicPosting post. People who are not signed in are refused with `NOT_SIGNED_IN`. A second vote on the same note is refused with `ALREADY_VOTED`. Unvoting without a vote is refused with `NO_VOTE`.

```endpoints
posting.ranking.UpvotePost at /posts/upvote
posting.ranking.DownvotePost at /posts/downvote
posting.ranking.UnvotePost at /posts/unvote
```

The page can [read the signed-in person's vote](reaction:posting.ranking.ReadVote) on one note. That endpoint reads the user from the session, then `Upvoting._getVote`. People who are not signed in are refused with `NOT_SIGNED_IN`. When they have not voted, the answer has no `upvote` field.

```endpoints
posting.ranking.ReadVote at /posts/vote
```
