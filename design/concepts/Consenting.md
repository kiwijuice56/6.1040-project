# Consenting

## Purpose

Let people agree to a particular use of their things, and withdraw that agreement later.

*Prevents:* someone withdraws their consent, and anyone who checks still finds that they consent; someone consents twice, withdraws once, and still has a consent on record.

## Principle

Maya consents to having her uploads described by a language model, and when anyone checks whether she consents to that use, Consenting returns true. A week later she withdraws her consent, and the same check returns false. Sam never consents, and the check returns false for him too. When Maya tries to withdraw her consent a second time, she is refused with "You haven't consented to this."

## Types

```types
external Person
  Whoever gives or withdraws consent.

external Use
  A use of a person's things that needs their consent.
```

## State

```state
a set of Consents with
  a Person
  a Use
  unique person and use
```

## Actions

```actions
consent(person: Person, use: Use) : returns (person: Person, use: Use)
  where a consent has person and use
  then
    refuses ALREADY_CONSENTED "You have already consented to this."
  where no consent has person and use
  then
    add a new consent with person and use
    returns person, use

withdraw(person: Person, use: Use) : returns (person: Person, use: Use)
  where no consent has person and use
  then
    refuses NOT_CONSENTED "You haven't consented to this."
  where a consent has person and use
  then
    remove that consent
    returns person, use
```

## Queries

```queries
_consented(person: Person, use: Use) : one (consented: Flag)
  Returns true when the person consents to the use, and false otherwise.
```
