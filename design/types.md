# Sticky types

Every person in Sticky is a Registering user, signed in with Commons. That user is the one a session belongs to.

CommonsFederating is Federating with Commons as the other site. Signing in with Google would add a second instance, `instantiate Federating as GoogleFederating`, with its own provider.

```types
concrete Feature
  A use of a person's data that needs their consent.

concrete SearchAlgorithm
  The identity of a Querying ranking procedure. Sticky uses `tokenFuzzy`.
```

Sticky uses one Feature, `sharingLocation`: keeping the map on the person's GPS. Consenting records whether they agreed to that use; the page asks the browser for GPS only after they have.

```instances
instantiate Registering

instantiate Federating as CommonsFederating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User

instantiate Consenting with
  Person is Registering.User
  Use is Feature

instantiate GeographicPosting with
  User is Registering.User

instantiate Upvoting with
  User is Registering.User
  Resource is GeographicPosting.Post

instantiate Querying with
  Resource is GeographicPosting.Post
  SearchAlgorithm is SearchAlgorithm

instantiate Labeling with
  Resource is GeographicPosting.Post
```

