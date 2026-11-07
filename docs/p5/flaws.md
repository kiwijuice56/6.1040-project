# Design flaws

## Flaw 1: Upvote/downvote imprecise meaning
- **Severity**: Moderate
- **Level**: Conceptual
A user pointed out that they weren't sure what was meant by upvoting or downvoting within the context of Sticky. For example, should users downvote notes only if they are false, or should they downvote redundant or unhelpful notes as well? A system that renames upvote/downvote to true/false could make the rating system more useful, but it would also require additional ratings such as "unhelpful" to filter out useless notes.

## Flaw 2: Log-in sequence confusing
- **Severity**: Moderate
- **Level**: Conceptual
The entire process of logging in was slightly confusing and frustrating to users. On an implementation level, bugs with refreshing the page required my intervention to fix. On a design level, both users were confused by the password/username requirements and the role of Commons in the sign-in process. The log-in page should be redesigned to prioritize Sticky logins first (preferably with email instead of plain text usernames for added security), and other federation methods should be added (e.g. Google) to reduce friction.

## Flaw 3: Notes too small
- **Severity**: Minor
- **Level**: Physical
Both users struggled to aim and click on notes on the map because the dots were too small. This can be easily fixed by increasing the clickable area size of each note. This would make it more pressing to consider how Sticky should handle overlapping notes, however (an issue that I didn't approach throughout the class project because it was unlikely to occur with a limited userbase).