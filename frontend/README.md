# OpenShelf Frontend

The frontend for **OpenShelf**, an educational PDF library built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

* Browse and search publicly available educational PDFs without logging in.
* View document details and read PDFs online.
* Register, log in, and verify email addresses.
* Like and bookmark documents and access personal library features.
* Access administrative features with an authorized administrator account.

## Requirements

* Node.js and npm
* The OpenShelf backend running locally
* A configured PostgreSQL database through the backend

## Setup

From the repository root, install frontend dependencies:

```powershell
cd frontend
npm install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env.local
```

The default configuration is:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Change this URL if your backend uses a different address.

## Run locally

Start the development server:

```powershell
npm run dev
```

Open http://localhost:3000.

Ensure the backend is running and its database is configured before testing features that require API access.

## Validation

Run ESLint:

```powershell
npm run lint
```

Create a production build:

```powershell
npm run build
```

Start the production build locally:

```powershell
npm run start
```

Run `npm run build` before deploying.

## Deployment

Deploy the frontend to a compatible Next.js hosting platform. Configure `NEXT_PUBLIC_API_URL` to point to the deployed backend's HTTPS API origin.

Configure backend CORS to allow the deployed frontend origin. Keep credentials, database URLs, and secret keys in environment variables on the appropriate server; never expose backend secrets through `NEXT_PUBLIC_` variables.

See the repository-root `README.md` for the complete application setup and deployment guidance.
