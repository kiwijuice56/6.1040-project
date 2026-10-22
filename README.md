# Sticky
[Link to live app](https://sticky.mit-sdg.dev/).

## P1
- [Design notebook (private)](https://github.com/kiwijuice56/6.1040-homework-fa26/tree/main/project/design-notebook.md)
- [Problem framing and stakeholders](docs/p1/problem-framing.md)
- [Application pitch](docs/p1/application-pitch.md)
- [Concept specifications and essential reactions](docs/p1/concepts-and-reactions.md)
- [UI sketches](docs/p1/ui-sketches.md)
- [User journey](docs/p1/user-journey.md)
## P2 
- [Design notebook (private)](https://github.com/kiwijuice56/6.1040-homework-fa26/tree/main/project/design-notebook.md)
- [Updated user journey](docs/p2/user-journey.md)
- [User journey video](docs/p2/user-journey.mp4)
## P3
- [Visual study](https://docs.google.com/presentation/d/161UhO2MOadJnFcJR5gb5zliLfOzlw8lOOjnFVynC9ww/edit?usp=sharing)
- [Updated user journey (written)](docs/p3/user-journey.md)
- [Updated user journey (video)](https://youtu.be/mOpjAN1GwCs)
- [Link to live app](https://sticky.mit-sdg.dev/)
- [Automated test output](docs/p3/saved_test_output.md)

## Tests

The automated tests cover concepts and the HTTP endpoints that compose them. They use a throwaway MongoDB database per file, so they do not write to the app database.

1. Start the local database: `bun run db:up`. This runs MongoDB in Podman. On Windows, run `podman machine start` first if the machine is stopped.
2. Copy `.env.example` to `.env` if you have not. Tests read `MONGODB_URL` from that file (`mongodb://dev:dev@127.0.0.1:27017/sticky?authSource=admin`).
3. Run `bun test`.

To save that output, from PowerShell:

```powershell
bun test --no-color 2>&1 | ForEach-Object { "$_" } | Set-Content -Encoding utf8 docs/p3/bun-test.txt
```

Name the file `.txt`. `.gitignore` ignores `*.log`, so a `.log` file would not be committed. The latest saved log is [docs/p3/bun-test.txt](docs/p3/bun-test.txt).

Bun loads `.env` on its own. Each test starts from an empty database and creates its data by calling actions.

# Attribution
- [Paper background image from Wikimedia Commons, by pinkorchid_too (Sandra)](https://commons.wikimedia.org/wiki/File:Vintage_paper_texture_-_Flickr_-_pinkorchid_too_(Sandra).jpg).
- [UI Icons by Icons8](https://icons8.com/icons).