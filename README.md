# Sticky
Sticky is a web-app that helps people navigate daily tasks (e.g. booking an appointment or boarding a train) through user-contributed sticky notes written on a global map. Instead of relying on non-specific or vague instructions on the internet, users can get advice relevant to the exact location that they need to traverse.

The backend was developed in Bun and the frontend was designed in Vue, both according to the concept design principles of [MIT's software design course](https://61040.github.io/fa26/).

**[Try the live app!](https://sticky.mit-sdg.dev/)**

## Running Locally

You need [Bun](https://bun.sh/) 1.4.2 or newer and [Podman](https://podman.io/) with `podman compose`, which runs the MongoDB database. On Windows and macOS, start the Podman machine first with `podman machine start`.

1. Install dependencies: `bun install`.
2. Copy `.env.example` to `.env`. The defaults point at the local database and at Commons (`https://class.mit-sdg.dev`) for sign-in. `CARTO_API_KEY` is optional; the map tiles load without it.
3. Start the app: `bun run dev`. This starts MongoDB in Podman, the backend on port 3000 (restarts when `src/` changes), and the Vite frontend on port 8080 (reloads when `web/` changes).
4. Open [http://127.0.0.1:8080](http://127.0.0.1:8080). You can sign in with a Commons account or create a username and password account from the sign-in page.

Other useful commands:

| Command | Notes |
| --- | --- |
| `bun run preview` | Builds the frontend and serves the whole app from the backend at [http://127.0.0.1:3000](http://127.0.0.1:3000), as in production. |
| `bun run up` / `bun run down` | Runs the database, backend, and frontend all in containers (app at port 8080), or stops them. |
| `bun run db:reset` | Stops the containers and deletes the local database. |
| `bun run check` | Type-checks the code and checks that the generated sync-engine artifacts are up to date. Run `bun run generate` after changing a spec in `design/`. |
| `bun run check:design` | Checks the concept and composition specs in `design/`. |

## Running Automated Tests

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

## Design Notes

Below are notes and deliverables created alongside Sticky explaining design choices and demonstrating development progress. All documents can be found in `docs/`.
## P4
- [Design document](docs/p4/design-document.md)
- [Demonstration video](https://youtu.be/fe9tq-tWSrw)
## P3
- [Visual study](https://docs.google.com/presentation/d/161UhO2MOadJnFcJR5gb5zliLfOzlw8lOOjnFVynC9ww/edit?usp=sharing)
- [Updated user journey (written)](docs/p3/user-journey.md)
- [Updated user journey (video)](https://youtu.be/mOpjAN1GwCs)
- [Link to live app](https://sticky.mit-sdg.dev/)
- [Automated test output](docs/p3/saved_test_output.md)
## P2 
- [Design notebook (private)](https://github.com/kiwijuice56/6.1040-homework-fa26/tree/main/project/design-notebook.md)
- [Updated user journey](docs/p2/user-journey.md)
- [User journey video](docs/p2/user-journey.mp4)
## P1
- [Design notebook (private)](https://github.com/kiwijuice56/6.1040-homework-fa26/tree/main/project/design-notebook.md)
- [Problem framing and stakeholders](docs/p1/problem-framing.md)
- [Application pitch](docs/p1/application-pitch.md)
- [Concept specifications and essential reactions](docs/p1/concepts-and-reactions.md)
- [UI sketches](docs/p1/ui-sketches.md)
- [User journey](docs/p1/user-journey.md)

## Attribution
- [Paper background image from Wikimedia Commons, by pinkorchid_too (Sandra)](https://commons.wikimedia.org/wiki/File:Vintage_paper_texture_-_Flickr_-_pinkorchid_too_(Sandra)jpg)
- [UI Icons by Icons8](https://icons8.com/icons)