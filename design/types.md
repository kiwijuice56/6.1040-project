# Sticky types

Every person in Sticky is a Registering user, signed in with Commons. That user is the one a session belongs to.

CommonsFederating is Federating with Commons as the other site. Signing in with Google would add a second instance, `instantiate Federating as GoogleFederating`, with its own provider.

```types
concrete Feature
  A use of a person's data that needs their consent.
```

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
```