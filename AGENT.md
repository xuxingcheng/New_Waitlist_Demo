# AGENTS.md

## Project Goal

Build a restaurant waitlist demo website that exactly follows the “smart queue” algorithm described in the provided patent document.

This is not a generic waitlist app. The website must demonstrate the algorithm logic clearly:

1. A customer takes a queue number.
2. The system sends/updates the customer’s current queue status and estimated waiting time.
3. The customer must periodically confirm online that they are still waiting.
4. If the customer confirms, they remain in the active queue flow.
5. If the customer fails to confirm, their queue position is delayed instead of being completely removed.
6. Customers are managed through virtual electronic waiting-seat groups.
7. When close to being served, the customer enters the final waiting stage.
8. The customer enters a dining seat/table.
9. After dining is finished, the actual dining time is recorded.
10. Future estimated waiting time is updated using historical dining-time data.

The demo should use a restaurant scenario.

## Product Name

Smart Restaurant Queue Demo

## Core Scenario

A restaurant uses this system to reduce physical waiting. Customers can take a number from their phone, receive queue updates, confirm that they are still waiting, delay themselves if needed, check in near their turn, and finally get seated.

Restaurant staff can view the queue, see each customer’s current status, call the next customer, mark customers as seated, and mark dining as finished.

## Tech Stack

Use a modern web stack.

Preferred stack:

* Next.js
* TypeScript
* React
* Tailwind CSS
* Local mock database for now
* Clear database adapter interface so a real database can be connected later

Do not hard-code the app in a way that makes future database migration difficult.

## Database Requirement

For the first version, use a local mock database.

Acceptable options:

* In-memory mock database
* JSON-file-backed mock database
* LocalStorage-backed mock database for browser demo

Preferred approach:

Create a database abstraction layer.

Example structure:

```txt
/src/lib/db/
  queueRepository.ts
  mockQueueRepository.ts
  types.ts
```

The app should call repository functions, not directly access mock data everywhere.

This is required because the system should later be connected to a real database such as PostgreSQL, MySQL, Supabase, Firebase, or MongoDB.

## Repository Interface Requirement

Create an interface similar to this:

```ts
export interface QueueRepository {
  createTicket(input: CreateTicketInput): Promise<QueueTicket>;
  getTicket(ticketId: string): Promise<QueueTicket | null>;
  listActiveTickets(): Promise<QueueTicket[]>;
  updateTicket(ticketId: string, updates: Partial<QueueTicket>): Promise<QueueTicket>;
  confirmTicket(ticketId: string): Promise<QueueTicket>;
  delayTicket(ticketId: string, reason: DelayReason): Promise<QueueTicket>;
  checkInTicket(ticketId: string): Promise<QueueTicket>;
  seatTicket(ticketId: string, tableId: string): Promise<QueueTicket>;
  finishDining(ticketId: string): Promise<QueueTicket>;
  getDiningHistory(): Promise<DiningRecord[]>;
  addDiningRecord(record: DiningRecord): Promise<DiningRecord>;
}
```

The mock repository should implement this interface.

Later, a real database repository can replace the mock repository without changing the UI or algorithm layer.

## Required Pages

### 1. Customer Page

Route suggestion:

```txt
/customer
```

The customer page should allow a restaurant guest to:

* Enter name
* Enter party size
* Take a queue number
* View ticket number
* View current position
* View virtual waiting group
* View estimated waiting time
* View current status
* Confirm online
* Request delay
* Check in when the system requires final check-in
* See whether they are waiting, delayed, checked in, seated, or finished

The customer page should feel like a mobile-first website.

### 2. Staff/Admin Page

Route suggestion:

```txt
/admin
```

The admin page should allow staff to:

* View the full active queue
* View each ticket’s number, customer name, party size, status, position, group, last confirmation time, and estimated wait
* Trigger confirmation requests
* Simulate missed confirmations
* Move unconfirmed customers back according to the algorithm
* Call next customer
* Mark customer as seated
* Mark dining as finished
* View recent dining time records
* View current average dining time used for prediction

### 3. Demo/Simulation Page

Route suggestion:

```txt
/demo
```

This page should make the algorithm easy to understand.

It should include:

* Add sample customers button
* Run one algorithm step button
* Trigger online confirmation round button
* Simulate time passing button
* Reset demo button
* Visual explanation of current queue movement

This page is important because the project is a demo of an algorithm, not just a restaurant app.

## Required Ticket Statuses

Use a strict state machine.

Required statuses:

```ts
export type TicketStatus =
  | "WAITING"
  | "NEEDS_CONFIRMATION"
  | "CONFIRMED"
  | "DELAYED"
  | "CHECK_IN_REQUIRED"
  | "CHECKED_IN"
  | "SEATED"
  | "FINISHED"
  | "CANCELLED";
```

Meaning:

* `WAITING`: Customer has taken a number and is in the queue.
* `NEEDS_CONFIRMATION`: System is asking the customer to confirm they are still waiting.
* `CONFIRMED`: Customer confirmed online and remains active.
* `DELAYED`: Customer has been moved back because they requested delay or failed confirmation.
* `CHECK_IN_REQUIRED`: Customer is near their turn and must check in.
* `CHECKED_IN`: Customer completed final check-in and is ready to be seated.
* `SEATED`: Customer has entered a dining seat/table.
* `FINISHED`: Dining is finished and the ticket is completed.
* `CANCELLED`: Customer left the queue.

## Required Data Models

### QueueTicket

```ts
export interface QueueTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  partySize: number;

  status: TicketStatus;

  position: number;
  virtualGroup: number;

  createdAt: string;
  updatedAt: string;

  lastConfirmationAt?: string;
  confirmationDueAt?: string;
  confirmationCount: number;
  missedConfirmationCount: number;

  checkInRequiredAt?: string;
  checkedInAt?: string;

  seatedAt?: string;
  finishedAt?: string;

  tableId?: string;

  estimatedWaitMinutes: number;

  delayHistory: DelayEvent[];
}
```

### DelayEvent

```ts
export type DelayReason =
  | "MISSED_CONFIRMATION"
  | "CUSTOMER_REQUEST"
  | "STAFF_ACTION";

export interface DelayEvent {
  id: string;
  ticketId: string;
  reason: DelayReason;
  oldPosition: number;
  newPosition: number;
  oldVirtualGroup: number;
  newVirtualGroup: number;
  createdAt: string;
}
```

### DiningRecord

```ts
export interface DiningRecord {
  id: string;
  ticketId: string;
  partySize: number;
  tableId: string;
  seatedAt: string;
  finishedAt: string;
  diningDurationMinutes: number;
}
```

### Table

```ts
export interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED";
  currentTicketId?: string;
}
```

## Algorithm Logic

The website must implement the smart queue logic as a separate algorithm module.

Suggested structure:

```txt
/src/lib/algorithm/
  queueAlgorithm.ts
  waitTimeEstimator.ts
  stateMachine.ts
```

Do not bury algorithm logic inside React components.

## Main Algorithm Rules

### Rule 1: Customer Takes Number

When a customer creates a ticket:

1. Generate a ticket number, such as `A001`, `A002`, etc.
2. Add the customer to the end of the active queue.
3. Assign a position.
4. Assign a virtual waiting group.
5. Set status to `WAITING`.
6. Calculate estimated wait time.

Example:

```ts
createTicket({
  customerName: "Yvonne",
  partySize: 3
});
```

Result:

```txt
Ticket A008 created.
Position: 8
Virtual Group: 3
Status: WAITING
```

### Rule 2: Synchronized Queue Updates

Every ticket should receive updated information whenever the queue changes.

The UI should always show:

* Current status
* Current position
* Current virtual group
* Estimated wait time
* Whether confirmation is needed
* Whether check-in is required

For the demo, this can be implemented with polling, local state refresh, or manual simulation buttons.

### Rule 3: Periodic Online Confirmation

The system periodically asks waiting customers to confirm online.

For demo purposes, the interval can be short, such as 30 seconds.

In production, it could be longer, such as 5–10 minutes.

When confirmation is triggered:

* Eligible customers move from `WAITING` or `CONFIRMED` to `NEEDS_CONFIRMATION`.
* Each ticket receives a `confirmationDueAt` time.
* The customer page should display a clear confirmation button.

### Rule 4: If Customer Confirms

If the customer confirms before the due time:

1. Set status to `CONFIRMED`.
2. Update `lastConfirmationAt`.
3. Increase `confirmationCount`.
4. Clear or update `confirmationDueAt`.
5. Keep the customer in the active queue.

Important: confirmation should protect the customer from being skipped.

### Rule 5: If Customer Does Not Confirm

If the customer misses confirmation:

1. The customer should not be fully removed.
2. The customer’s queue sequence should be delayed.
3. In the first confirmation stage, delay the customer by 1 position.
4. Increase `missedConfirmationCount`.
5. Add a delay record with reason `MISSED_CONFIRMATION`.
6. Set status to `DELAYED`.
7. Recalculate all queue positions.
8. Recalculate estimated wait time.
9. The customer should be asked to confirm again later.

This follows the patent logic where a customer who does not confirm is delayed by one position and re-enters online confirmation.

### Rule 6: Virtual Electronic Waiting Seat Groups

The system must divide customers into virtual waiting groups.

These are not real restaurant tables.

They are virtual queue-management groups.

Example grouping rule for demo:

```txt
Group 1: positions 1–3
Group 2: positions 4–6
Group 3: positions 7–9
Group 4: positions 10–12
```

Use a configurable group size.

```ts
const VIRTUAL_GROUP_SIZE = 3;
```

After every queue change, recalculate:

```ts
virtualGroup = Math.ceil(position / VIRTUAL_GROUP_SIZE);
```

### Rule 7: Customer Requests Delay

If the customer taps “Delay Me”:

1. Move the customer to the next virtual waiting group.
2. Set status to `DELAYED`.
3. Add a delay record with reason `CUSTOMER_REQUEST`.
4. Recalculate positions.
5. Recalculate wait times.

Example:

If the customer is currently in Group 1, move them to the end of Group 2.

This follows the patent logic that a customer who actively delays should be moved to the next virtual electronic waiting-seat group.

### Rule 8: Final Waiting Stage

When a customer gets close to the front of the queue, the system should require final check-in.

Suggested demo rule:

```txt
If customer position <= number of available tables + 1,
set status to CHECK_IN_REQUIRED.
```

The customer page should show:

```txt
Your table is almost ready. Please check in.
```

For the website demo, check-in can be a button.

Optional visual feature:

Show a fake QR code card to represent on-site QR check-in.

### Rule 9: Check-In

When the customer checks in:

1. Set status to `CHECKED_IN`.
2. Set `checkedInAt`.
3. Keep the customer in the final queue.
4. Allow staff to seat the customer.

### Rule 10: Enter Dining Seat

When staff seats the customer:

1. Set status to `SEATED`.
2. Set `seatedAt`.
3. Assign a table ID.
4. Mark table as occupied.
5. Remove the customer from the active waiting queue.
6. Recalculate remaining queue positions.
7. Update wait-time estimates.

This corresponds to entering the dining seat and ending the queue.

### Rule 11: Dining Finished

When staff marks dining as finished:

1. Set status to `FINISHED`.
2. Set `finishedAt`.
3. Mark table as available.
4. Create a `DiningRecord`.
5. Calculate dining duration.
6. Add the dining duration to historical data.
7. Use this data to improve future waiting-time estimates.

This follows the patent logic where the used dining time is synchronized and used for wait-time prediction.

## Wait-Time Estimation

Create a simple but clear wait-time estimator.

For the demo:

```txt
Estimated wait =
(number of active customers ahead / available table count) × average dining time
```

Use historical dining records to calculate average dining time.

If there is not enough history, use a default value.

```ts
const DEFAULT_AVERAGE_DINING_MINUTES = 45;
```

Better version:

Calculate by party size.

Example:

```txt
Party size 1–2: average 35 minutes
Party size 3–4: average 50 minutes
Party size 5+: average 65 minutes
```

If there are no records for that party-size group, fall back to the general average.

## Required UI Behavior

The website should make queue movement visually obvious.

Use badges for status:

* WAITING: gray
* NEEDS_CONFIRMATION: yellow
* CONFIRMED: green
* DELAYED: purple
* CHECK_IN_REQUIRED: blue
* CHECKED_IN: cyan
* SEATED: orange
* FINISHED: muted gray

The admin queue table should update positions after every action.

The customer screen should be clear enough for a non-technical viewer to understand.

## Required Demo Controls

The admin/demo page must include buttons for:

* Add sample customers
* Trigger confirmation round
* Confirm selected customer
* Miss confirmation for selected customer
* Customer requests delay
* Require check-in for next customer
* Check in selected customer
* Seat selected customer
* Finish dining for selected customer
* Recalculate wait times
* Reset demo

## Sample Customers

Use sample seed data like:

```ts
[
  { customerName: "Mia", partySize: 2 },
  { customerName: "Kevin", partySize: 4 },
  { customerName: "Yvonne", partySize: 3 },
  { customerName: "Leo", partySize: 5 },
  { customerName: "Nora", partySize: 2 },
  { customerName: "Alex", partySize: 6 }
]
```

## Tables Seed Data

Use a small restaurant layout:

```ts
[
  { id: "T1", name: "Table 1", capacity: 2, status: "AVAILABLE" },
  { id: "T2", name: "Table 2", capacity: 4, status: "AVAILABLE" },
  { id: "T3", name: "Table 3", capacity: 4, status: "AVAILABLE" },
  { id: "T4", name: "Table 4", capacity: 6, status: "AVAILABLE" }
]
```

## Important Implementation Rule

Do not implement this as a simple FIFO queue only.

The project must show the special logic:

* Online confirmation
* Missed confirmation causes delay
* Active customer delay moves to next virtual group
* Virtual electronic waiting-seat groups
* Final check-in stage
* Dining-time learning for future wait-time prediction

## Suggested File Structure

```txt
/src
  /app
    /customer
      page.tsx
    /admin
      page.tsx
    /demo
      page.tsx
    page.tsx

  /components
    CustomerTicketCard.tsx
    QueueTable.tsx
    StatusBadge.tsx
    DemoControls.tsx
    TableStatusPanel.tsx
    WaitTimePanel.tsx
    VirtualGroupView.tsx

  /lib
    /algorithm
      queueAlgorithm.ts
      stateMachine.ts
      waitTimeEstimator.ts

    /db
      types.ts
      queueRepository.ts
      mockQueueRepository.ts

    /utils
      time.ts
      ticketNumber.ts

  /data
    seed.ts
```

## State Machine Validation

Create helper functions to prevent invalid state transitions.

Examples:

A ticket can move:

```txt
WAITING → NEEDS_CONFIRMATION
NEEDS_CONFIRMATION → CONFIRMED
NEEDS_CONFIRMATION → DELAYED
CONFIRMED → NEEDS_CONFIRMATION
CONFIRMED → CHECK_IN_REQUIRED
DELAYED → NEEDS_CONFIRMATION
CHECK_IN_REQUIRED → CHECKED_IN
CHECKED_IN → SEATED
SEATED → FINISHED
```

A ticket should not move:

```txt
FINISHED → WAITING
CANCELLED → SEATED
WAITING → FINISHED
NEEDS_CONFIRMATION → SEATED
```

If an invalid transition is attempted, return a clear error.

## Acceptance Criteria

The website is complete when the following are true:

1. A customer can create a queue ticket.
2. The customer can view ticket number, position, group, status, and estimated wait.
3. Admin can view all active tickets.
4. Admin can trigger an online confirmation round.
5. Customer can confirm online.
6. If customer misses confirmation, the system delays them instead of deleting them.
7. Customer can request delay and move to the next virtual group.
8. The app recalculates queue positions after delay.
9. The app recalculates virtual groups after delay.
10. The app recalculates estimated wait times after queue changes.
11. A customer close to the front can enter `CHECK_IN_REQUIRED`.
12. Customer can check in.
13. Staff can seat the customer.
14. Staff can mark dining as finished.
15. Dining duration is recorded.
16. Future wait-time estimates use dining history.
17. The mock database is accessed through a repository interface.
18. It should be easy to replace the mock database with a real database later.
19. The website is visually clear and demo-friendly.
20. Algorithm code is separate from React UI code.

## Visual Style

Use a clean, modern dashboard style.

Preferred style:

* White background
* Rounded cards
* Soft shadows
* Clear status badges
* Mobile-first customer page
* Desktop-friendly admin page
* Simple animation when queue positions change

The website should look like a polished demo, not a raw technical prototype.

## Notes for Future Real Database Connection

Leave a clear TODO section in the database layer.

Example:

```ts
// TODO: Replace MockQueueRepository with PostgresQueueRepository.
// The UI and algorithm should not need to change.
// Only the repository implementation should change.
```

Add a short README section explaining how to switch from mock storage to real database storage.

## Final Deliverable

Create a working website demo.

The final project should include:

* Customer page
* Admin page
* Demo simulation page
* Mock local database
* Repository interface for future database
* Queue algorithm module
* Wait-time estimator module
* Clear state machine
* Seed data
* Basic README

The main purpose is to demonstrate the patented smart-queue logic in a restaurant waitlist scenario.
