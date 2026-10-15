# OpenShelf — PDF Library

OpenShelf is a web-based educational PDF library that helps users discover, read, search, download, and organize educational documents. It provides public access to the library, authenticated features for registered users, and administrative tools for managing PDF documents.

## Features

### Public Library

* Browse the public library without signing in.
* Search documents by available metadata, including title, description, and author.
* Filter documents by categories.
* View document details and available metadata.
* Read supported PDFs online and download available documents.

### User Accounts

* User registration and login.
* Email verification using SMTP.
* Optional Google OAuth sign-in.
* JWT-based authentication and protected account features.
* Like and bookmark documents.
* Access a personal library and reading history.
* View application notifications.

### Administration

* Role-based access control for administrative features.
* Admin dashboard and document management.
* Upload and manage PDF documents.
* Track OCR processing status and retry OCR when supported.

### PDF Processing and Search

* Support for scanned PDFs and text-based PDFs.
* OCR processing for scanned documents.
* Preserve original uploaded PDF files.
* Search and discover documents using available metadata and extracted text, where supported.

## Technology Stack

| Component           | Technologies                                        |
| ------------------- | --------------------------------------------------- |
| Frontend            | Next.js, React, TypeScript, Tailwind CSS            |
| PDF Reader          | React PDF                                           |
| Backend             | Python, FastAPI, Uvicorn                            |
| Database            | PostgreSQL, SQLAlchemy                              |
| Database Migrations | Alembic                                             |
| Authentication      | JWT, Argon2 password hashing, optional Google OAuth |
| Email               | Python SMTP integration                             |
| Document Processing | OCR and text extraction tools                       |

## Project Structure

```text
pdf-library/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   │   └── versions/
│   ├── storage/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── .gitignore
└── README.md
```

The directory listing above describes the main project areas; individual files may vary as development continues.

**Document storage:** Local development can use the `backend/storage/` directory. Production deployment is configured to use private Vercel Blob storage for uploaded PDFs, including original and OCR-processed files. Render's temporary filesystem must not be treated as permanent document storage. Environment secrets and locally stored PDF files must never be committed to Git.

## Prerequisites

Install the following software before setting up the project:

* Python 3.12
* Node.js and npm
* PostgreSQL
* Git

The commands below use Windows PowerShell. Adjust paths and commands as needed for other operating systems.

## Development Setup

### 1. Open the project

Open PowerShell in the project root:

```powershell
cd "C:\Users\Komal Pandey\pdf-library"
```

If you have cloned the repository, navigate to the directory where you cloned it instead.

### 2. Create the PostgreSQL database

Create a database named `pdf_library` and a dedicated PostgreSQL user with appropriate permissions.

For example, using `psql` with a PostgreSQL account that has permission to create users and databases:

```sql
CREATE USER pdf_library_user WITH PASSWORD 'replace_with_a_strong_password';

CREATE DATABASE pdf_library OWNER pdf_library_user;
```

Use a strong password and keep it private.

### 3. Configure the backend environment

From the project root, create and activate a Python virtual environment:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
python -m pip install -r backend\requirements.txt
```

Create the local backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and replace the placeholder values.

At a minimum, configure:

* `DATABASE_URL` — PostgreSQL connection URL for the `pdf_library` database.
* `JWT_SECRET_KEY` — a strong, randomly generated secret.
* `SESSION_SECRET_KEY` — a separate, strong session secret.

The database URL follows this general format:

```text
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

If your password contains special characters, URL-encode them when placing the password in the connection URL.

#### Email verification

To enable email verification, configure the SMTP settings:

* `SMTP_HOST`
* `SMTP_PORT`
* `SMTP_USERNAME`
* `SMTP_PASSWORD`
* `SMTP_FROM_EMAIL`

For Gmail, use a Gmail App Password where required, rather than your regular account password.

#### Google sign-in

Google sign-in is optional. To enable it, configure:

* `GOOGLE_CLIENT_ID`
* `GOOGLE_CLIENT_SECRET`
* `GOOGLE_REDIRECT_URI`

The redirect URI must match the URI registered in your Google OAuth configuration.

Keep all credentials and secret values private. Never commit the real `backend/.env` file.

### 4. Apply database migrations

With the virtual environment activated, run the following commands from the project root:

```powershell
Set-Location backend
alembic upgrade head
```

Alembic applies the database migrations to the configured PostgreSQL database.

To inspect the current migration revision and available migration heads:

```powershell
alembic current
alembic heads
```

If you open a new terminal, activate the virtual environment from the project root before entering the backend directory:

```powershell
.\.venv\Scripts\Activate.ps1
Set-Location backend
```

### 5. Start the backend

From the `backend` directory, with the virtual environment activated:

```powershell
uvicorn main:app --reload
```

The local backend should be available at:

* API root: http://127.0.0.1:8000/
* Interactive API documentation: http://127.0.0.1:8000/docs
* Health endpoint: http://127.0.0.1:8000/api/v1/health

Keep this terminal running while developing.

### 6. Configure the frontend

Open a second PowerShell terminal and navigate to the project root:

```powershell
cd "C:\Users\Komal Pandey\pdf-library"
```

Create the local frontend environment file:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

The default local API URL is:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

If the backend runs at a different address, update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

Install the frontend dependencies:

```powershell
Set-Location frontend
npm ci
```

### 7. Start the frontend

From the `frontend` directory:

```powershell
npm run dev
```

Open the application in your browser:

http://localhost:3000

The frontend and backend must both be running for the complete local application to work.

## Useful Development Commands

### Frontend

Run these commands from `frontend/`:

```powershell
npm run dev
npm run lint
npm run build
npm run start
```

* `npm run dev` starts the development server.
* `npm run lint` checks code quality.
* `npm run build` creates a production build.
* `npm run start` starts the production server after a successful build.

### Backend

Run these commands from `backend/` with the project virtual environment activated:

```powershell
uvicorn main:app --reload
alembic current
alembic heads
alembic upgrade head
python -m pip check
```

Use the migration commands to inspect and apply database schema changes. Use `python -m pip check` to check installed Python package dependencies.

## Environment Variables

Environment configuration is separated between the backend and frontend.

| File                    | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `backend/.env.example`  | Backend configuration template          |
| `backend/.env`          | Local backend configuration and secrets |
| `frontend/.env.example` | Frontend configuration template         |
| `frontend/.env.local`   | Local frontend configuration            |

The backend configuration includes database access, authentication secrets, optional Google OAuth, SMTP settings, frontend URL, email-verification expiry, and PDF upload size settings.

The frontend configuration includes the backend API base URL.

Environment variable names and defaults should be checked against the application's configuration files when setting up a new environment.

## Security Considerations

* Never commit `.env`, `.env.local`, passwords, OAuth secrets, SMTP credentials, or authentication secrets.
* Use strong, unique secrets for JWT signing and session management.
* Keep administrative endpoints protected by server-side authorization checks.
* Do not rely on frontend checks alone to enforce permissions.
* Validate uploaded files and enforce configured file-size limits.
* Store uploaded PDFs in an appropriate storage location with controlled access.
* Use HTTPS in production.
* Configure CORS to allow only trusted frontend origins.
* Configure secure session cookies when deployed over HTTPS.
* Protect database credentials and restrict database permissions.
* Back up the database and uploaded documents.
* Do not expose private storage files through unrestricted static file serving.

## Production Deployment

The application must be configured for the production environment before it is publicly deployed.

### Backend and database

* Provision a PostgreSQL database and configure its connection URL.
* Configure strong, unique JWT and session secrets.
* Configure the production frontend URL and CORS origins.
* Configure SMTP credentials and verify email delivery.
* Configure Google OAuth redirect URIs if Google sign-in is enabled.
* Run Alembic migrations against the production database.
* Configure durable storage for uploaded PDFs and a backup strategy.
* Verify OCR dependencies, file handling, and document access permissions.
* Disable development-only settings and avoid using `--reload` in production.

### Frontend

* Set `NEXT_PUBLIC_API_URL` to the deployed backend's HTTPS URL.
* Configure the frontend hosting environment variables.
* Run the production build and resolve build errors before deployment.
* Verify authentication, API requests, PDF viewing, downloads, and account actions against the deployed backend.

### Final production checks

* Verify registration, login, logout, and email verification.
* Verify that public browsing works without requiring login.
* Verify that user-only and admin-only actions enforce authorization.
* Test document uploads, downloads, reading, search, likes, bookmarks, and reading history.
* Test OCR processing and manual retry where supported.
* Confirm that secrets, database credentials, and private uploaded files are not exposed.
* Test error handling, database backups, and recovery procedures.

**Important:** The local development configuration uses localhost URLs and is not production-ready without the required changes. Actual deployment steps depend on the selected frontend host, backend host, database provider, and file-storage solution.

## Contributing

Contributions and improvements are welcome. Before submitting changes, run the relevant frontend checks and verify backend functionality in your development environment.

Do not include credentials, local environment files, virtual environments, dependency directories, or uploaded documents in commits.

## License

No license has been specified yet. Until a license is added, do not assume that the repository grants permission to redistribute or reuse its contents.
