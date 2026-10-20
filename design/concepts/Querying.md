# Querying

## Purpose

Find the resources whose text is most relevant to a search.

*Prevents:* ranking without the query; ranking a resource that was never given a document; a deleted or discarded search still returning results.

## Principle

If resources are indexed into a SearchContext with their documents, `_getNResults` returns those whose documents best match a query, best first, according to the named SearchAlgorithm.

## Types

```types
external Resource
  The contribution being searched.

external SearchAlgorithm
  The identity of a ranking procedure over a query string and indexed documents.

opaque Bundle
  The documents to search: each member has a resource and a document string.
```

## State

```state
a set of SearchContexts

a set of IndexEntries with
  a context SearchContext
  a resource Resource
  a document String
  unique context and resource
```

## Actions

```actions
createContext() : returns (context: SearchContext)
  where true
  then
    add a SearchContext
    returns context

index(context: SearchContext, resource: Resource, document: String) : returns (resource: Resource)
  where context is unknown
  then
    refuses CONTEXT_NOT_FOUND "There is no such search."
  where an index entry already has this context and resource
  then
    refuses ALREADY_INDEXED "That resource is already in this search."
  where context exists and no index entry has this context and resource
  then
    add an index entry with context, resource, and document
    returns resource

unindex(context: SearchContext, resource: Resource) : returns (resource: Resource)
  where context is unknown
  then
    refuses CONTEXT_NOT_FOUND "There is no such search."
  where no index entry has this context and resource
  then
    refuses NOT_INDEXED "That resource is not in this search."
  where an index entry has this context and resource
  then
    remove that index entry
    returns resource

replace(context: SearchContext, bundle: Bundle) : returns (context: SearchContext)
  where context is unknown
  then
    refuses CONTEXT_NOT_FOUND "There is no such search."
  where bundle is not a list of resource-and-document members
  then
    refuses INVALID_BUNDLE "That is not a list of documents to search."
  where context exists and bundle is a list of resource-and-document members
  then
    remove every index entry whose context is this context
    add an index entry for each member
    returns context

discard(context: SearchContext) : returns (context: SearchContext)
  where context is unknown
  then
    refuses CONTEXT_NOT_FOUND "There is no such search."
  where context exists
  then
    remove every index entry whose context is this context
    remove the SearchContext
    returns context

unindexEverywhere(resource: Resource) : returns (resource: Resource)
  where true
  then
    remove every index entry whose resource is this resource
    returns resource

reindexEverywhere(resource: Resource, document: String) : returns (resource: Resource)
  where true
  then
    overwrite the document of every index entry whose resource is this resource
    returns resource
```

## Queries

```queries
_getNResults(context: SearchContext, algorithm: SearchAlgorithm, query: String, resultCount: Number) : many (resource: Resource, rank: Number)
  The indexed resources for this context whose documents match the query, according to algorithm. Rows are ordered best first: a higher rank is a better match. Resources with rank 0 are omitted. At most resultCount rows. When the context is unknown, the algorithm is unknown, the query has no searchable text, or resultCount is not a positive number, no rows.

_indexed(context: SearchContext) : many (resource: Resource, document: String)
  The indexed members of this context, or no rows when the context is unknown or empty. The order of the rows is unspecified.

_context(context: SearchContext) : optional (context: SearchContext)
  The SearchContext, or no row when it is unknown.
```
