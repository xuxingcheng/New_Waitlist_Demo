# Smart Restaurant Queue Demo

A restaurant waitlist demo that implements the smart queue flow from
`AGENT.md`: online confirmation, missed-confirmation delay, virtual electronic
waiting-seat groups, final check-in, seating, dining completion, and wait-time
learning from historical dining records.

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy With GitHub Pages

This project is configured for static export and GitHub Pages deployment.

1. Push `main` to GitHub.
2. In the GitHub repository, open **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open **Actions** and run or wait for **Deploy to GitHub Pages**.

The site will deploy to:

```txt
https://xuxingcheng.github.io/New_Waitlist_Demo/
```

The GitHub Actions workflow sets the required `/New_Waitlist_Demo` base path for
GitHub Pages. Local development still runs at `http://localhost:3000`.

## Pages

- `/customer` - mobile-first customer flow for taking a number, confirming,
  requesting delay, viewing position/group/status/wait time, and final check-in.
- `/admin` - staff dashboard for confirmation rounds, missed confirmations,
  queue movement, seating, finishing dining, table status, and history.
- `/demo` - simulation view with sample data, one-step algorithm execution,
  confirmation rounds, time passing, reset, virtual groups, and movement lanes.

## Architecture

The UI calls a repository interface instead of reading or writing mock data
directly:

```txt
src/lib/db/queueRepository.ts
src/lib/db/mockQueueRepository.ts
src/lib/db/types.ts
```

The smart queue logic is separate from React components:

```txt
src/lib/algorithm/stateMachine.ts
src/lib/algorithm/queueAlgorithm.ts
src/lib/algorithm/waitTimeEstimator.ts
```

The mock repository uses browser `localStorage`, so the demo can run without a
server database. To connect a real database later, create another implementation
of `QueueDemoRepository` such as `PostgresQueueRepository` or
`SupabaseQueueRepository`, then swap the exported repository in
`src/lib/db/mockQueueRepository.ts`. The UI and algorithm modules should not
need to change.
