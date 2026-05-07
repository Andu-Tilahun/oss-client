# AgriVest

AgriVest is a managed digital platform that connects farm plots with investors in a structured, trusted environment. The frontend application enables coordinated planning, lease execution, follow-up operations, and visibility across the full farm-to-investor lifecycle.

## Platform Overview

The platform supports multiple user roles (Admin, Investor, Extension Worker, Operator) and provides role-aware navigation, pages, and actions. Its main goal is to orchestrate resource delivery between farms and investors: from plot discovery, agreement workflows, and extension-worker assignment to field follow-ups, contract tracking, and operational transparency.

In practice, AgriVest helps teams:

- Match investable farm plots with interested investors under platform governance
- Coordinate lease and service workflows with clear ownership and status tracking
- Connect field execution (extension worker activities) to investor visibility
- Reduce operational gaps between planning, funding, implementation, and reporting
- Maintain an auditable process across farm operations and investment activity

## Core Features

- **Role-based dashboards**
  - Investor dashboard with capital and lease insights
  - Extension Worker dashboard with assigned plot and follow-up summary

- **Farm plot management**
  - Explore and preview plots
  - Extension Worker assigned-plot workspace
  - Dedicated mobile detail flow for smaller screens

- **Lease management**
  - Lease listing, filtering, status tracking, and detail view
  - Contract preview and download flow
  - Assignment of extension workers to accepted leases

- **Follow-up tracking**
  - Follow-up listing and creation for assigned lease records
  - Integrated follow-up visibility inside lease and extension-worker detail tabs

- **Crowdfunding and investments**
  - Campaign and investment sections integrated into platform navigation
  - Capital deployment visibility tied to lease and farm operations context

## Tech Stack

- Angular 17
- TypeScript
- Tailwind-based UI styling
- Modular feature architecture with standalone and module-based components

## Local Development

Install dependencies and run the app:

```bash
npm install
npm run host
```

The app runs at:

- `http://localhost:4200/`

## Build and Test

```bash
npm run build
npm test
```
