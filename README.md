# GovBid AI — Procurement Evaluation Workspace

A working judges' demonstration of government procurement: tender creation, document uploads, verified requirements, sealed bid submission, technical review, financial ranking, risk review, committee recommendation and human approval.

## Run locally

Requires Node.js 24 or later.

1. Extract the ZIP.
2. Double-click `Start-GovBid.cmd`, or run `node server/local.mjs`. The ZIP includes the built website; no package installation is needed to run it.
3. Open http://127.0.0.1:4173.

To rebuild from source, run `npm install` and `npm run build` first.

The local app creates a real SQLite database at `data/govbid.sqlite`. You can open it with DB Browser for SQLite or another SQLite client while the app is stopped. **Never commit this file**: it contains workspace records and document contents.

## Netlify

Import this repository into Netlify. Build: `npm run build`; publish: `dist`; functions: `netlify/functions`. Node version: 24. The included `netlify/database/migrations/0001_initial.sql` provisions the database and creates its tables during deployment. Netlify Database uses PostgreSQL; no database credentials are shipped to the browser. The function uses `@netlify/database` to receive the environment's database connection.

A drag-and-drop of only the built `dist` folder does not deploy the backend. Use the source ZIP with a supported full-stack import or connect this GitHub repository. Do not claim a static-only deployment has a working cloud database.

## Judges walkthrough (5–10 minutes)

- Enter as Procurement Officer. Five tenders and fifteen fictional bidders are seeded in your private browser workspace.
- Open Database to inspect stored records, export JSON, or preview and import a CSV/JSON dataset. The provided CSV is explicitly fictional; replace it with records you are authorized to use.
- Open tender 001, switch to Technical Evaluator, click **Why?** and resolve the missing warranty value with a reasoned override (PASS or FAIL based on evidence). Complete human review.
- Switch to Financial Evaluator. Calculate L1 or QCBS. Only technically qualified bids appear.
- Run risk analysis. Switch to Technical Evaluator to review any findings. Record a reason.
- Generate the report as Financial Evaluator. Print/save PDF or download the HTML report.
- Switch to Evaluation Committee and submit a recommendation, then Competent Authority to confirm the final demonstration decision.
- Open Audit Trail to show attribution, preserved overrides, stage transitions and the decision record.
- Tender 003 is already awaiting approval for a faster presentation path.

## Real records and database access

Use Database → Import for CSV or JSON with `title,department,value_crore,deadline,opening` and optional `category,description`. Supply the original dataset source or authorization. Dates use ISO 8601 timestamps with a zone; live workflow deadlines must be in the future. Import creates drafts for review, not automatically verified procurements. Do not alter historical deadlines and present them as the original dates.

Each browser session has an isolated database workspace. The Database explorer reads this workspace through the server and supports JSON export; raw SQL credentials are not public. The Netlify project owner can use the Netlify Database console for administrative PostgreSQL access. Browser sessions last 30 days; export important records before clearing cookies or signing out. This prototype does not implement account recovery or production government identity verification.

## Install as software

The application includes a PWA manifest. In Chrome or Edge, open the hosted HTTPS app and use the browser's Install app option. It runs in its own window. This is an installable web app, not an offline native executable. Network access is required for the hosted database. Local mode works with the included Node server and SQLite.

## Scope and boundaries

- Real: saved database records, CSV/JSON import, uploaded file preservation and SHA-256 hashes, role checks, deadline locks, deterministic evaluations, human overrides, report exports and audit records.
- Simulated: government roles and seeded evidence. AI extraction is a fictional fallback; there is no live LLM, OCR, malware scanner, digital signature, external procurement integration or automatic contract award.
- Scores use fixed-point integer paise for monetary amounts and deterministic comparisons. QCBS uses numeric ratios with two-decimal display rounding.
- Role switching is deliberately available for the judges. This is not production access control for sensitive government operations. Do not expose confidential procurement information in a public demo.
- Public visitors cannot read another browser's records. Uploaded files are stored in the database and served as attachments after workspace ownership checks (3 MB per file).
- The ordinary UI has no audit-edit operation. Database administrators can still alter database contents; this is not cryptographically immutable auditing.
- AI_SYSTEM cannot sign in or perform approvals. Only the human Competent Authority demo role can record a final decision after review prerequisites and confirmation.

## Validation

`npm test` covers seed integrity, the entire lifecycle, late submissions, incomplete reviews, unauthorized approvals, deterministic ranking, persistence, workspace isolation, import validation and upload ownership.
