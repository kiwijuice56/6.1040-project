# Saving

A signed-in person saves a note with the bookmark. The page sends the post to the [save endpoint](reaction:saving.keeping.SaveNote). That endpoint reads the user from the session with `Sessioning.use`, looks up their Registering username, `Labeling.ensure`s a label whose identity is that username, then `Labeling.applyLabel`. People who are not signed in are refused with `NOT_SIGNED_IN`. A second save of the same note is refused with `ALREADY_LABELED`.

```endpoints
saving.keeping.SaveNote at /saves/save
```

They can [unsave](reaction:saving.keeping.UnsaveNote) with the same username label and `Labeling.removeLabel`. Unsaving a note that is not in the group is refused with `NOT_LABELED`.

```endpoints
saving.keeping.UnsaveNote at /saves/unsave
```

The [My notes tab](reaction:saving.listing.ListSaves) reads [the saved notes](former:saving.listing.SavedNotes): each resource under that username label, with the public note fields. When the label is unknown or empty, there are no rows.

```endpoints
saving.listing.ListSaves at /saves/list
```

After someone posts a note, the [auto-save reaction](reaction:saving.keeping.SaveOwnNote) ensures their username label and applies it to the new post. They can unsave and save it again later. After a note is deleted, the [unlabel reaction](reaction:saving.keeping.UnlabelDeletedNote) calls `Labeling.unlabelEverywhere`.
