# OpenShelf — Educational PDF Library

OpenShelf is a web-based educational PDF library that helps users **discover, search, read, download, and organize educational documents** through a centralized digital library.

Built using **Next.js, React, TypeScript, Tailwind CSS, Python, FastAPI, PostgreSQL, SQLAlchemy, OCR, and Vercel**, OpenShelf provides public library access, secure user accounts, personalized reading features, and administrative document management.

The platform supports text-based and scanned PDF documents, automated OCR processing, document categorization, online PDF reading, bookmarks, likes, reading history, and document discovery.

---

# Live Application

**Production Application:**

https://open-shelf-ebon.vercel.app/

**Backend Health Check:**

https://openshelf-api-zzaz.onrender.com/api/v1/health

**GitHub Repository:**

https://github.com/HiKomal11/OpenShelf

**Application Name:** OpenShelf

**Project Type:** Full-Stack Web Application

**Deployment:** Vercel, Render, Neon PostgreSQL, and Vercel Blob

---

# Project Overview

Educational documents are often distributed across different websites, devices, and storage platforms. Finding relevant learning materials, reading them conveniently, and keeping track of useful documents can become difficult.

OpenShelf addresses these challenges by providing a centralized digital library for educational PDFs.

The platform allows visitors to browse publicly available documents without creating an account. Registered users can access personalized features, while administrators can manage documents and categories through protected administrative interfaces.

OpenShelf also includes document processing capabilities to support scanned PDFs through OCR, making document text available for supported search and discovery operations.

The application uses a cloud-hosted architecture, so users can access the deployed website without running the frontend or backend on their own computers.

---

# Features

## 1. Public PDF Library

OpenShelf provides a publicly accessible document library.

Users can:

* Browse available educational PDFs without signing in.
* Search documents using available metadata, including title, description, and author.
* Filter documents by category.
* View individual document details.
* Read supported PDF files online.
* Download available documents.
* Navigate through paginated library results.

Public browsing does not require authentication.

---

## 2. User Registration and Authentication

OpenShelf provides account management and authentication features.

Users can:

* Register for an account.
* Sign in using their credentials.
* Verify their email address.
* Access protected account features.
* Sign out of their account.
* Use Google sign-in when OAuth is configured.
* Access their personalized library and reading history.

The backend uses JWT-based authentication and Argon2 password hashing.

Administrative permissions are enforced by the backend rather than relying solely on frontend visibility.

---

## 3. Email Verification

OpenShelf supports email verification for registered accounts.

The verification workflow includes:

1. User registration.
2. Verification email generation.
3. Delivery through SMTP.
4. Opening the verification link.
5. Validation of the verification request.
6. Updating the account's verification status.

The production email service can be configured using SMTP credentials. Gmail SMTP can be used with an appropriate Gmail App Password.

---

## 4. Google OAuth Sign-In

OpenShelf supports optional Google OAuth authentication.

When configured, users can authenticate through their Google accounts rather than relying exclusively on password-based login.

The integration requires:

* Google OAuth Client ID
* Google OAuth Client Secret
* Registered redirect URI
* Correct frontend and backend URL configuration

Google sign-in depends on the configured OAuth credentials and provider availability.

---

## 5. PDF Upload and Document Management

Authorized administrators can upload and manage educational PDF documents.

Document management includes:

* Uploading PDF files.
* Maintaining document metadata.
* Managing document titles and descriptions.
* Associating documents with categories.
* Making eligible documents available through the public library.
* Monitoring OCR processing status.
* Retrying OCR processing where supported.

Original uploaded PDF files are preserved during document processing.

Administrative operations are protected by role-based authorization.

---

## 6. Automated OCR Processing

OpenShelf supports OCR processing for scanned PDF documents.

OCR, or Optical Character Recognition, extracts machine-readable text from scanned document pages.

The processing workflow is:

1. An administrator uploads a PDF.
2. The application stores the original document.
3. The document processing workflow identifies the need for text extraction or OCR.
4. OCR processing extracts text from scanned pages.
5. Processing status is recorded.
6. Extracted text can support document discovery where implemented.
7. Administrators can retry failed OCR processing where supported.

The application distinguishes OCR processing status from the original uploaded file, allowing processing issues to be investigated without replacing the original document.

Text extraction and OCR results depend on document quality, language support, and processing success.

---

## 7. Online PDF Reader

OpenShelf includes an online PDF reading interface.

Users can read supported documents directly in their browser instead of downloading every file first.

The reader supports document loading, page navigation, zoom controls, and error handling.

The PDF reader is integrated with the document viewing workflow so users can access educational material from the library.

---

## 8. Search and Discovery

OpenShelf provides document discovery through metadata search and category filtering.

Users can search using available fields such as:

* Document title
* Description
* Author

Category filtering helps users narrow the available documents to relevant subjects.

Extracted text from OCR processing can also support full-text discovery where that functionality is available.

The library uses pagination to organize results and improve navigation through larger document collections.

---

## 9. Document Likes

Authenticated users can like documents.

The application records document interactions so users can engage with educational resources they find useful.

Like operations require an authenticated account and are handled through the backend API.

---

## 10. Bookmarks and My Library

OpenShelf provides a personalized library for registered users.

Users can bookmark documents they want to revisit later.

The My Library interface provides access to saved documents and supports navigation through a user's bookmarked resources.

This feature helps users organize educational material without having to search for the same documents repeatedly.

---

## 11. Reading History

OpenShelf supports reading-history features for authenticated users.

Document views can be recorded so users can revisit previously accessed resources.

Reading history is available through the personalized library interface, subject to successful recording of document interactions.

---

## 12. Notifications

The application includes a notification interface for account-related and application notifications.

The notification interface is integrated into the authenticated user experience.

Notification availability depends on the notification records and events supported by the application.

---

## 13. Admin Dashboard

OpenShelf includes a protected administrative dashboard.

Authorized administrators can access administrative features for managing the document library.

Administrative functionality includes:

* Accessing the admin dashboard.
* Managing PDF documents.
* Uploading documents.
* Managing document categories.
* Monitoring OCR processing status.
* Retrying OCR processing where supported.
* Accessing administrative user-management features.

Administrative routes require backend authorization, so hiding an administrative button in the frontend is not treated as a substitute for access control.

---

## 14. User and Role Management

OpenShelf uses role-based access control to distinguish regular users from administrators.

### User

Regular users can:

* Browse the public library.
* Read and download available documents.
* Like documents.
* Bookmark documents.
* Access their personal library.
* View reading history.
* Access protected account features.

### Administrator

Administrators receive the regular user capabilities along with authorized administrative features.

These include document management, category management, and administrative user-management operations.

An account can hold both `USER` and `ADMIN` roles. The backend checks permissions when protected endpoints are accessed.

---

## 15. Cloud-Based PDF Storage

OpenShelf uses Vercel Blob for production PDF storage.

The production architecture separates application hosting, database storage, and PDF file storage.

* Vercel hosts the frontend.
* Render hosts the FastAPI backend.
* Neon hosts the PostgreSQL database.
* Vercel Blob stores uploaded PDF files.

This separation avoids relying on the backend's temporary filesystem as permanent document storage.

Private storage credentials must remain on the server side and must not be exposed in frontend code or committed to Git.

---

# System Architecture

OpenShelf uses a client-server architecture with a separately hosted frontend, backend API, relational database, and document storage.

```text
                  ┌─────────────────────────┐
                  │       End Users         │
                  │   Users / Administrators│
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │     Next.js Frontend    │
                  │ React + TypeScript      │
                  │       Vercel            │
                  └────────────┬────────────┘
                               │
                          HTTPS API
                               │
                               ▼
                  ┌─────────────────────────┐
                  │      FastAPI Backend    │
                  │       Render            │
                  │                         │
                  │ Authentication          │
                  │ Authorization            │
                  │ Document Management      │
                  │ OCR and PDF Processing   │
                  └───────────┬─────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
          ┌────────────┐ ┌──────────┐ ┌─────────────┐
          │ PostgreSQL │ │  Vercel  │ │ OCR / PDF   │
          │   Neon     │ │   Blob   │ │ Processing  │
          └────────────┘ └──────────┘ └─────────────┘
                 │            │            │
                 ▼            ▼            ▼
             User Data     PDF Files    Extracted Text
             and Metadata  and Storage  and OCR Status
```

---

# Technologies Used

| Technology                 | Purpose                                |
| -------------------------- | -------------------------------------- |
| Next.js                    | Frontend application framework         |
| React                      | Component-based user interface         |
| TypeScript                 | Type-safe frontend development         |
| Tailwind CSS               | Interface styling                      |
| React PDF                  | Online PDF rendering                   |
| Python                     | Backend programming language           |
| FastAPI                    | REST API development                   |
| Uvicorn                    | ASGI server                            |
| PostgreSQL                 | Relational database                    |
| SQLAlchemy                 | Database ORM                           |
| Alembic                    | Database schema migrations             |
| JWT                        | Authentication tokens                  |
| Argon2                     | Password hashing                       |
| Authlib / Google OAuth     | Optional Google sign-in                |
| SMTP                       | Email verification delivery            |
| OCR tools                  | Text extraction from scanned documents |
| Vercel                     | Frontend deployment                    |
| Render                     | Backend deployment                     |
| Neon                       | Hosted PostgreSQL database             |
| Vercel Blob                | Cloud PDF storage                      |
| Git                        | Version control                        |
| GitHub                     | Source code hosting                    |
| Node.js and npm            | Frontend development environment       |
| Python virtual environment | Isolated backend dependencies          |

---

# Project Structure

The repository is organized into frontend and backend applications.

```text
OpenShelf/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── storage/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── library/
│   │   ├── login/
│   │   ├── my-library/
│   │   └── ...
│   │
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── .gitignore
├── .python-version
├── README.md
└── render.yaml
```

The structure above highlights the main application areas. Individual routes, components, migrations, and supporting files may evolve as the project develops.

---

# Database Design

OpenShelf uses PostgreSQL to store application data and relationships.

The database includes entities and relationships for:

* Users and authentication.
* Roles and user-role assignments.
* Categories.
* Documents and document metadata.
* Document file records.
* Document categories.
* Document access and interaction records.
* Document likes.
* Document bookmarks.
* Document views.

Alembic manages database schema migrations so schema changes can be applied and tracked across environments.

The database stores document metadata and interaction records, while the actual PDF files are stored through the configured storage backend.

---

# Authentication and Access Control

OpenShelf combines authentication and authorization to protect user and administrative operations.

## Authentication

The authentication system supports account registration, login, email verification, JWT-based authentication, and optional Google OAuth.

Passwords are hashed using Argon2 rather than stored as plain text.

## Authorization

The backend uses role-based authorization for protected operations.

```text
                 Incoming Request
                        │
                        ▼
                Authenticate User
                        │
                        ▼
                Validate Permissions
                        │
              ┌─────────┴─────────┐
              │                   │
          Authorized          Unauthorized
              │                   │
              ▼                   ▼
       Process Request       Reject Request
```

Public library browsing remains available without requiring an authenticated session. User-specific operations and administrative functionality require the appropriate permissions.

---

# PDF Processing Workflow

```text
              Administrator Upload
                       │
                       ▼
                 Validate PDF
                       │
                       ▼
              Store Original File
                       │
                       ▼
             Process Document Text
                       │
             ┌─────────┴─────────┐
             │                   │
        Text Available       Scanned Pages
             │                   │
             ▼                   ▼
        Extract Text          Run OCR
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
             Record Processing Status
                       │
                       ▼
             Publish Eligible Document
                       │
                       ▼
             Browse / Search / Read
                       │
                       ▼
                 Download PDF
```

OCR processing may fail for damaged, low-quality, unsupported, or unusually formatted documents. Processing status and retry functionality help administrators handle supported recovery scenarios.

---

# Installation

OpenShelf can be run locally for development and testing.

## Prerequisites

Install:

* Python 3.12
* Node.js and npm
* PostgreSQL, or access to a compatible PostgreSQL database
* Git

The commands below use Windows PowerShell.

## 1. Clone the Repository

```powershell
git clone https://github.com/HiKomal11/OpenShelf.git
```

## 2. Enter the Project Directory

```powershell
cd OpenShelf
```

## 3. Create a Python Virtual Environment

From the project root:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 4. Install Backend Dependencies

```powershell
python -m pip install -r backend\requirements.txt
```

## 5. Configure Backend Environment Variables

Create the local environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Configure the appropriate values in `backend/.env`, including:

* `DATABASE_URL`
* `JWT_SECRET_KEY`
* `SESSION_SECRET_KEY`
* `FRONTEND_URL`
* `CORS_ORIGINS`

For email verification, configure the required SMTP variables.

For Google sign-in, configure the Google OAuth credentials and redirect URI.

Use the variable names and defaults defined in the application's configuration files. Never commit real credentials or secret values.

## 6. Apply Database Migrations

From the project root:

```powershell
Set-Location backend
alembic upgrade head
```

This applies the database migrations to the PostgreSQL database configured in the backend environment.

Return to the project root when needed:

```powershell
Set-Location ..
```

## 7. Configure the Frontend

Create the frontend environment file:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

For local development, the API URL should point to the local backend:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Install frontend dependencies:

```powershell
Set-Location frontend
npm ci
```

---

# Run the Application Locally

## Start the Backend

Open a terminal at the project root, activate the virtual environment, and run:

```powershell
.\.venv\Scripts\Activate.ps1
Set-Location backend
uvicorn main:app --reload
```

The backend will normally be available at:

```text
API:       http://127.0.0.1:8000/
API Docs:  http://127.0.0.1:8000/docs
Health:    http://127.0.0.1:8000/api/v1/health
```

Keep this terminal running during local development.

## Start the Frontend

Open a second terminal:

```powershell
cd OpenShelf\frontend
npm run dev
```

If your terminal is already inside the project root, simply run:

```powershell
Set-Location frontend
npm run dev
```

Open the application:

```text
http://localhost:3000
```

The frontend and backend must both be running for the complete local application to work. PostgreSQL must also be reachable.

---

# Useful Development Commands

## Frontend

Run these commands from `frontend/`.

```powershell
npm run dev
npm run lint
npm run build
npm run start
```

| Command         | Purpose                            |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the local development server |
| `npm run lint`  | Check frontend code quality        |
| `npm run build` | Create a production build          |
| `npm run start` | Run the production build locally   |

## Backend

Run these commands from `backend/` with the Python virtual environment activated.

```powershell
uvicorn main:app --reload
alembic current
alembic heads
alembic upgrade head
python -m pip check
```

| Command                     | Purpose                                |
| --------------------------- | -------------------------------------- |
| `uvicorn main:app --reload` | Start the backend in development mode  |
| `alembic current`           | Display the current migration revision |
| `alembic heads`             | Display available migration heads      |
| `alembic upgrade head`      | Apply migrations                       |
| `python -m pip check`       | Check installed Python dependencies    |

---

# Production Deployment

OpenShelf is deployed using separate cloud services.

## Deployment Architecture

| Component           | Hosting Provider |
| ------------------- | ---------------- |
| Frontend            | Vercel           |
| Backend API         | Render           |
| PostgreSQL Database | Neon             |
| PDF File Storage    | Vercel Blob      |
| Source Code         | GitHub           |

## Production URLs

```text
Frontend:
https://open-shelf-ebon.vercel.app/

Backend Health:
https://openshelf-api-zzaz.onrender.com/api/v1/health

GitHub:
https://github.com/HiKomal11/OpenShelf
```

## Deployment Workflow

```text
             GitHub Repository
                     │
                     ▼
              Frontend Changes
                     │
                     ▼
                   Vercel
                     │
                     ▼
             Live Web Application
                     │
                     ▼
                Render API
                     │
             ┌───────┴────────┐
             ▼                ▼
          Neon DB          Vercel Blob
```

The frontend communicates with the backend through its configured API URL. The backend connects to the hosted PostgreSQL database and the configured PDF storage service.

When changes are pushed to the connected GitHub branch, the hosting provider can build and deploy the updated application according to its deployment settings.

## Using the Live Application

Visitors can use the deployed website without running local development servers.

You do not need to start the frontend, backend, or database on your computer to access the production website.

**Hosting note:** Render's free service may sleep after inactivity, causing a delay on the first request. Availability and response times depend on the hosting providers and their current plans.

---

# Environment Variables and Security

OpenShelf separates backend secrets from frontend configuration.

## Backend Configuration

The backend environment includes settings for:

* Database connectivity.
* JWT authentication.
* Session security.
* CORS and frontend URLs.
* SMTP email delivery.
* Google OAuth.
* PDF storage.
* OCR and document processing.

## Frontend Configuration

The frontend uses:

```text
NEXT_PUBLIC_API_URL
```

This should point to the backend API base URL for the relevant environment. The deployed frontend uses the production backend URL.

## Security Considerations

* Never commit `.env`, `.env.local`, passwords, or API secrets.
* Keep database credentials and private Blob tokens on the server side.
* Use strong, unique authentication and session secrets.
* Protect administrative endpoints with backend authorization.
* Validate uploaded files and enforce upload size limits.
* Configure CORS to allow trusted origins only.
* Use HTTPS in production.
* Keep database access restricted to authorized services.
* Back up important database records and uploaded documents.
* Avoid exposing private storage objects through unrestricted public routes.

---

# Testing and Verification

The application has been developed and tested across its main frontend, backend, authentication, database, and deployment workflows.

Areas to validate during development and future releases include:

* Frontend production build.
* Backend health endpoint.
* Database migrations.
* User registration and login.
* Email verification.
* Google OAuth configuration.
* Public library access without login.
* Document details and category filtering.
* PDF viewing and downloads.
* Document uploads and administrative permissions.
* OCR processing and retry behavior.
* Likes, bookmarks, and reading history.
* Role-based access control.
* Production frontend-to-backend communication.
* Cloud PDF storage configuration.

Testing status can change as new features are added or deployment configuration changes.

---

# Advantages

### Centralized Educational Resources

Provides a single location to discover and access educational PDFs.

### Public Accessibility

Allows visitors to browse available resources without mandatory registration.

### Personalized Library

Bookmarks and reading history help users organize documents of interest.

### Document Search

Metadata search and category filters help users find relevant material.

### Scanned PDF Support

OCR processing helps extract text from scanned documents.

### Online Reading

Users can read supported PDFs directly through the browser.

### Role-Based Administration

Protects administrative features and separates user permissions.

### Cloud-Based Deployment

Separates frontend hosting, backend processing, database storage, and PDF file storage.

---

# Current Limitations

OpenShelf is a deployed educational library application, but several aspects depend on hosting configuration and the supported document-processing workflow.

* OCR accuracy depends on scan quality, document layout, and language support.
* Full-text discovery depends on successful text extraction and the search functionality available for a document.
* Google OAuth requires correctly configured provider credentials and redirect URIs.
* Email verification depends on valid SMTP configuration and email delivery.
* Free hosting plans may introduce cold starts or resource limitations.
* PDF access and processing depend on storage availability and correct backend configuration.
* Database and document backups must be managed according to the production hosting setup.
* The application should undergo further security, performance, and accessibility testing before being used at a larger institutional scale.

---

# Future Improvements

Possible future improvements include:

* Advanced full-text search across extracted PDF content.
* Improved OCR quality and processing feedback.
* Additional language support.
* More advanced filtering and sorting.
* Enhanced reading progress tracking.
* Reading lists and collections.
* Better recommendations based on document metadata.
* More detailed administrative analytics.
* Improved accessibility and keyboard navigation.
* Automated testing for frontend and backend workflows.
* Expanded notification functionality.
* Enhanced document preview and metadata extraction.
* Monitoring, backup, and recovery improvements.
* Performance optimization for larger libraries.
* Mobile-focused reading improvements.

---

# Real-World Applications

OpenShelf can be adapted for:

* Colleges and universities.
* Schools and educational institutions.
* Digital libraries.
* Student learning-resource portals.
* Research and academic document collections.
* Training and professional development platforms.
* Public educational-resource repositories.
* Departmental knowledge libraries.
* Personal academic reading collections.

---

# Project Highlights

OpenShelf combines:

```text
Modern Web Development
          +
Full-Stack Architecture
          +
Secure Authentication
          +
Role-Based Authorization
          +
PostgreSQL Database
          +
PDF Upload and Storage
          +
OCR Processing
          +
Online PDF Reading
          +
Search and Discovery
          +
Personalized Library
          +
Cloud Deployment
```

The primary user workflow is:

```text
Browse
   ↓
Search and Filter
   ↓
Open Document
   ↓
Read Online or Download
   ↓
Like or Bookmark
   ↓
Revisit Through My Library
```

The administrative workflow is:

```text
Administrator Login
        ↓
Admin Dashboard
        ↓
Upload PDF
        ↓
Manage Metadata and Categories
        ↓
Process Document Text / OCR
        ↓
Monitor Processing Status
        ↓
Make Eligible Documents Available
```

---

# Author

## Komal Pandey

GitHub:

https://github.com/HiKomal11

Project Repository:

https://github.com/HiKomal11/OpenShelf

---

# License

OpenShelf is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for the complete license text.

Copyright (c) 2026 Komal Pandey

