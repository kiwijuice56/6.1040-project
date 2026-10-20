# Searching

A person types in the search bar. The page sends the map center and the search distance in miles to the [open endpoint](reaction:searching.opening.OpenSearch). That endpoint creates a Querying SearchContext and responds with [the nearby documents](former:searching.covering.NearbyDocuments): each GeographicPosting post inside that radius, using the post body as the document. The page then [loads](reaction:searching.covering.ReplaceSearch) those members into the context. Querying never reads a post itself. People who are not signed in can search; there is no session.

```endpoints
searching.opening.OpenSearch at /search/open
searching.covering.ReplaceSearch at /search/replace
```

When the distance or the notes on the map change, the page [lists nearby documents again](reaction:searching.covering.SyncSearch) and loads them with the same replace endpoint.

```endpoints
searching.covering.SyncSearch at /search/sync
```

The page then [asks for ranked notes](reaction:searching.ranking.RankSearch) using [the ranked notes](former:searching.ranking.RankedNotes). Querying `_getNResults` orders matches best first with the `tokenFuzzy` SearchAlgorithm. The former looks up each resource's public note fields. When the query is cleared, the page [discards](reaction:searching.opening.CloseSearch) the context.

```endpoints
searching.ranking.RankSearch at /search/query
searching.opening.CloseSearch at /search/close
```

After a note is deleted, the [unindex reaction](reaction:searching.keeping.UnindexDeletedNote) calls `Querying.unindexEverywhere`. After a note is edited, the [reindex reaction](reaction:searching.keeping.ReindexEditedNote) calls `Querying.reindexEverywhere` with the new body. Newly created notes are not in a context until the page syncs.
