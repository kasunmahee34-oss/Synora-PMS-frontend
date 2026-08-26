# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e_ui_test.spec.js >> Main navigation pages load
- Location: tests\e2e_ui_test.spec.js:19:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Dashboard/ })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: /Dashboard/ }) resolved to 3 elements:
    1) <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Ella PMS Dashboard</h1> aka getByRole('heading', { name: 'Ella PMS Dashboard' })
    2) <h2 class="sr-only">Dashboard</h2> aka getByRole('heading', { name: 'Dashboard' }).nth(1)
    3) <h2 class="text-xl font-semibold mt-2">Dashboard</h2> aka getByRole('heading', { name: 'Dashboard' }).nth(2)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Dashboard/ })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - complementary [ref=f1e4]:
    - generic [ref=f1e5]:
      - generic [ref=f1e11]:
        - generic [ref=f1e12]: ELLA PMS
        - paragraph [ref=f1e13]: Property Management
      - navigation [ref=f1e14]:
        - link "Dashboard" [ref=f1e15] [cursor=pointer]:
          - /url: /
        - link "Tape Chart" [ref=f1e21] [cursor=pointer]:
          - /url: /tape-chart
        - link "Rooms" [ref=f1e24] [cursor=pointer]:
          - /url: /rooms
        - link "Reservations" [ref=f1e28] [cursor=pointer]:
          - /url: /reservations
        - link "Guests" [ref=f1e31] [cursor=pointer]:
          - /url: /guests
        - link "Travel Agents" [ref=f1e37] [cursor=pointer]:
          - /url: /travel-agents
        - link "Night Audit" [ref=f1e41] [cursor=pointer]:
          - /url: /night-audit
        - link "Reports" [ref=f1e44] [cursor=pointer]:
          - /url: /reports
    - generic [ref=f1e48]:
      - generic [ref=f1e54]:
        - paragraph [ref=f1e55]: Administrator User
        - generic [ref=f1e56]: Administrator
      - button "Sign Out" [ref=f1e57] [cursor=pointer]
  - main [ref=f1e61]:
    - generic [ref=f1e63]:
      - generic [ref=f1e64]:
        - generic [ref=f1e65]:
          - heading "Ella PMS Dashboard" [level=1] [ref=f1e66]
          - heading "Dashboard" [level=2] [ref=f1e67]
          - heading "Dashboard" [level=2] [ref=f1e68]
        - generic [ref=f1e69]:
          - link "Tape Chart" [ref=f1e70] [cursor=pointer]:
            - /url: /tape-chart
          - link "Quick Booking" [ref=f1e74] [cursor=pointer]:
            - /url: /reservations/new
      - generic [ref=f1e76]:
        - generic [ref=f1e77]:
          - generic [ref=f1e78]: Occupancy Rate
          - generic [ref=f1e85]:
            - generic [ref=f1e86]: 11%
            - generic [ref=f1e87]: (1/9 rooms)
        - generic [ref=f1e90]:
          - generic [ref=f1e91]: Arrivals Today
          - generic [ref=f1e96]:
            - generic [ref=f1e97]: "0"
            - generic [ref=f1e98]: guests pending check-in
          - link "View active list" [ref=f1e100] [cursor=pointer]:
            - /url: /reservations
        - generic [ref=f1e104]:
          - generic [ref=f1e105]: Departures Today
          - generic [ref=f1e110]:
            - generic [ref=f1e111]: "1"
            - generic [ref=f1e112]: guests scheduled check-out
          - link "Reconcile folios" [ref=f1e114] [cursor=pointer]:
            - /url: /reservations
        - generic [ref=f1e118]:
          - generic [ref=f1e119]: Room Inventory
          - generic [ref=f1e125]:
            - generic [ref=f1e126]:
              - generic [ref=f1e127]: Clean/Avail
              - generic [ref=f1e128]: "5"
            - generic [ref=f1e129]:
              - generic [ref=f1e130]: Dirty
              - generic [ref=f1e131]: "3"
            - generic [ref=f1e132]:
              - generic [ref=f1e133]: Occupied
              - generic [ref=f1e134]: "1"
            - generic [ref=f1e135]:
              - generic [ref=f1e136]: Maintenance
              - generic [ref=f1e137]: "0"
      - generic [ref=f1e138]:
        - generic [ref=f1e140]:
          - generic [ref=f1e141]:
            - heading "Recent Bookings" [level=2] [ref=f1e142]
            - link "View All" [ref=f1e143] [cursor=pointer]:
              - /url: /reservations
          - table [ref=f1e147]:
            - rowgroup [ref=f1e148]:
              - row [ref=f1e149]:
                - columnheader "Confo No" [ref=f1e150]
                - columnheader "Guest" [ref=f1e151]
                - columnheader "Room" [ref=f1e152]
                - columnheader "Dates" [ref=f1e153]
                - columnheader "Status" [ref=f1e154]
            - rowgroup [ref=f1e155]:
              - row [ref=f1e156]:
                - cell "ELLA-20260814-3XOX" [ref=f1e157]
                - cell "nisal chandupa" [ref=f1e158]
                - cell "Room 104 (Deluxe Room)" [ref=f1e159]
                - cell "8/13/2026 – 8/16/2026" [ref=f1e160]
                - cell "In House" [ref=f1e161]
              - row [ref=f1e163]:
                - cell "ELLA-20260813-OZVG" [ref=f1e164]
                - cell "sanka" [ref=f1e165]
                - cell "Room 103 (Standard Room)" [ref=f1e166]
                - cell "8/14/2026 – 8/16/2026" [ref=f1e167]
                - cell "Completed" [ref=f1e168]
              - row [ref=f1e170]:
                - cell "ELLA-20260813-DV8T" [ref=f1e171]
                - cell "sanka" [ref=f1e172]
                - cell "Room 102 (Standard Room)" [ref=f1e173]
                - cell "8/11/2026 – 8/12/2026" [ref=f1e174]
                - cell "Completed" [ref=f1e175]
              - row [ref=f1e177]:
                - cell "ELLA-20260812-M7IC" [ref=f1e178]
                - cell "sanka" [ref=f1e179]
                - cell "Room 101 (Standard Room)" [ref=f1e180]
                - cell "8/10/2026 – 8/12/2026" [ref=f1e181]
                - cell "No Show" [ref=f1e182]
              - row [ref=f1e184]:
                - cell "ELLA-20260812-YL4I" [ref=f1e185]
                - cell "sanka" [ref=f1e186]
                - cell "Room 104 (Deluxe Room)" [ref=f1e187]
                - cell "8/11/2026 – 8/12/2026" [ref=f1e188]
                - cell "No Show" [ref=f1e189]
        - generic [ref=f1e192]:
          - heading "Room List Overview" [level=2] [ref=f1e193]
          - generic [ref=f1e194]:
            - generic [ref=f1e195]:
              - paragraph [ref=f1e196]: Room 101
              - generic [ref=f1e197]: dirty
            - generic [ref=f1e198]:
              - paragraph [ref=f1e199]: Room 102
              - generic [ref=f1e200]: dirty
            - generic [ref=f1e201]:
              - paragraph [ref=f1e202]: Room 103
              - generic [ref=f1e203]: dirty
            - generic [ref=f1e204]:
              - paragraph [ref=f1e205]: Room 104
              - generic [ref=f1e206]: occupied
            - generic [ref=f1e207]:
              - paragraph [ref=f1e208]: Room 105
              - generic [ref=f1e209]: available
            - generic [ref=f1e210]:
              - paragraph [ref=f1e211]: Room 201
              - generic [ref=f1e212]: available
            - generic [ref=f1e213]:
              - paragraph [ref=f1e214]: Room 202
              - generic [ref=f1e215]: available
            - generic [ref=f1e216]:
              - paragraph [ref=f1e217]: Room 203
              - generic [ref=f1e218]: available
            - generic [ref=f1e219]:
              - paragraph [ref=f1e220]: Room 204
              - generic [ref=f1e221]: available
          - generic [ref=f1e222]:
            - generic [ref=f1e223]: "Ground Floor Rooms: 1xx"
            - generic [ref=f1e224]: "First Floor Rooms: 2xx"
```