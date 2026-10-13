# Posting

A signed-in person clicks the map and writes a note. The page posts the note's body and the click's GPS coordinate to the [create endpoint](reaction:posting.creating.CreatePost). That endpoint reads the user from the session with `Sessioning.use`, never from the request, then calls `GeographicPosting.post`. People who are not signed in are refused with `NOT_SIGNED_IN`.

```endpoints
posting.creating.CreatePost at /posts/create
```
