# Querying

## Purpose

Find relevant resources out of a larger collection.

## Principle

Resources (i.e posts, comments) are indexed and unindexed into a SearchContext. A list of unique resources can then be queried according to the rules of a SearchAlgorithm.

## Types

```types
external Resource
  The contribution being ranked.

external SearchAlgorithm
  A ranking algorithm that accepts two resources and determines which one has a lower order.
```

## State

```state
a set of SearchContexts with
  a set of Resources
```

## Actions

```actions
createContext() : returns (context: SearchContext)
  where context does not already exist
  then create it and return it

index(resource: Resource, context: SearchContext)
  where resource and context both exist and resources not already in context
  then add resource to context

unindex(resource: Resource, context: SearchContext)
  where resource and context both exist; resource in context
  then remove resource from context
```

## Queries


```queries
_getNResults(context: SearchContext, algorithm: SearchAlgorithm, resultCount: number) : many (resource: Resource)
  Return at most resultCount amount of unique resources according to the ranking rules of algorithm.
```