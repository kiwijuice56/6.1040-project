# Concepts
## Commenting[Subject]
### Purpose
Allow users to author context on subjects
### Principle
...
### State
...
### Actions
#### create
- *where*:
- *then*: 
#### delete
- *where*:
- *then*: 
#### edit
- *where*:
- *then*: 


## GeographicBinding[Resource]
### Purpose
Associate a resource with a real-world physical location; keep resources up-to-date if interest points are updated or removed
### Principle
...
### State
...
### Actions
#### bind
- *where*:
- *then*: 
#### unbind
- *where*:
- *then*: 
#### expire
- *where*:
- *then*: 
#### update
- *where*:
- *then*: 



## Upvoting[Subject]
### Purpose
Filter low-quality contributions;
### Principle
...
### State
...
### Actions
#### upvote
- *where*:
- *then*: 
#### downvote
- *where*:
- *then*: 
#### unvote
- *where*:
- *then*: 

## Querying
### Purpose
Isolate relevant resources out of a larger collection;
### Principle
...
### State
...
### Actions
#### index
- *where*:
- *then*: 
#### _findTopResults
- *where*:
- *then*: 
#### delete
- *where*:
- *then*: 


## Tagging[Resource]
### Purpose
Make it easier to parse groups of related resources;
### Principle
Users can add or remove any number of alphanumeric tags to resources. They can then query for resources by tag.
### State
...
### Actions
#### index
- *where*:
- *then*: 
#### _findTopResults
- *where*:
- *then*: 
#### delete
- *where*:
- *then*: 

# Reactions
## CommentIndexing
TODO: when comments posted, index them
## CommentBinding
TODO: before/while comments posted, bind them to user-provided location and GPS coordinates
## CommentFiltering
TODO: when comment down voted too low, delete it
## Self-explanatory but necessary reactions:
- De-indexing comments when they are deleted
- Deleting comments when their location is deleted

# Notes
...