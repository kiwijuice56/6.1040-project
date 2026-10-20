# Labeling

## Purpose

Group related resources under a shared tag.

*Prevents:* applying or removing a membership on an unknown label; applying the same membership twice; a removed membership still appearing in the group; a deleted label still grouping resources; a gone resource lingering under labels.

## Principle

If a label is applied to several resources, `_resources` returns those resources in the order they were applied. Removing a membership drops that resource from the group; deleting the label drops the group. The same resource may belong to many labels at once.

## Types

```types
external Resource
  The item being grouped.
```

## State

```state
a set of Labels

a set of Memberships with
  a label Label
  a resource Resource
  unique label and resource
```

## Actions

```actions
createLabel() : returns (label: Label)
  where true
  then
    add a Label
    returns label

applyLabel(label: Label, resource: Resource) : returns (resource: Resource)
  where label is unknown
  then
    refuses LABEL_NOT_FOUND "There is no such label."
  where a membership already has this label and resource
  then
    refuses ALREADY_LABELED "That resource already has this label."
  where label exists and no membership has this label and resource
  then
    add a membership with label and resource
    returns resource

removeLabel(label: Label, resource: Resource) : returns (resource: Resource)
  where label is unknown
  then
    refuses LABEL_NOT_FOUND "There is no such label."
  where no membership has this label and resource
  then
    refuses NOT_LABELED "That resource does not have this label."
  where a membership has this label and resource
  then
    remove that membership
    returns resource

delete(label: Label) : returns (label: Label)
  where label is unknown
  then
    refuses LABEL_NOT_FOUND "There is no such label."
  where label exists
  then
    remove every membership whose label is this label
    remove the Label
    returns label

unlabelEverywhere(resource: Resource) : returns (resource: Resource)
  where true
  then
    remove every membership whose resource is this resource
    returns resource
```

## Queries

```queries
_resources(label: Label) : many (resource: Resource)
  The resources in this label, in the order they were applied, earliest first. No rows when the label is unknown or has no members.

_labels(resource: Resource) : many (label: Label)
  The labels that include this resource, in the order they were applied to it, earliest first. No rows when none do.

_has(label: Label, resource: Resource) : optional (resource: Resource)
  The resource if this label includes it, or no row when the label is unknown or the resource is not a member.

_label(label: Label) : optional (label: Label)
  The Label, or no row when it is unknown.
```
