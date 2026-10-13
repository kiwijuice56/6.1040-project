# Posting

A signed-in person clicks the map and writes a note. The page posts the note's body and the click's GPS coordinate to the [create endpoint](reaction:posting.creating.CreatePost). That endpoint reads the user from the session with `Sessioning.use`, never from the request, then calls `GeographicPosting.post`. People who are not signed in are refused with `NOT_SIGNED_IN`.

```endpoints
posting.creating.CreatePost at /posts/create
```

Anyone can [read every note](reaction:posting.listing.ListPosts) using [the public notes](former:posting.listing.AllNotes): each GeographicPosting post's identity, body, author, location, and the author's username from Registering. No session is required.

```endpoints
posting.listing.ListPosts at /posts/list
```
