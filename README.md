# Healthcare Appointment & Follow-up Manager

A Next.js 14 assignment project for a clinic appointment workflow. It includes patient, doctor, and admin portals, role-based login, Prisma models, AI summaries, slot holds, double-booking protection, doctor leave conflict handling, notification logs, email hooks, Google Calendar hooks, and a cron endpoint for reminders.

## Demo Login

All seeded demo accounts use `password123`.

| Role | Email |
| --- | --- |
| Admin | `admin@clinic.test` |
| Doctor | `doctor@clinic.test` |
| Patient | `patient@clinic.test` |

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Prisma + SQLite
- NextAuth Credentials provider
- OpenAI SDK for LLM summaries
- Nodemailer for email notifications
- Google Calendar API for appointment events
- Vercel Cron configuration for reminders

## Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

If Prisma migration has trouble on a restricted Windows machine, the SQL migration is included at `prisma/migrations/20260703000000_init/migration.sql`. Create the SQLite database from that SQL, then run:

```bash
npm run db:generate
npm run db:seed
npm run dev
```

## Environment Variables

Use `.env.example` as the template. Do not commit `.env`.

- `DATABASE_URL`: SQLite database path
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: authentication settings
- `OPENAI_API_KEY`: optional; fallback summaries are stored if missing
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: email delivery settings
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`: calendar integration
- `CRON_SECRET`: protects the reminder endpoint

## Pages

| Page | Purpose |
| --- | --- |
| `/login` | Login for all roles |
| `/register` | Patient registration |
| `/patient` | Search doctors, view available slots, book appointments, view post-visit summaries |
| `/doctor` | View appointments, read pre-visit AI summary, submit notes and prescription |
| `/admin` | Create doctors, mark leave, view all appointments and notification logs |

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a user |
| GET | `/api/doctors?specialisation=` | Search doctors |
| GET | `/api/doctors/:id/slots?date=` | Compute available slots |
| POST | `/api/appointments/hold` | Create a five-minute held appointment |
| POST | `/api/appointments/:id/symptoms` | Store symptoms and pre-visit LLM summary |
| POST | `/api/appointments/:id/confirm` | Confirm held appointment, send email, create calendar event |
| POST | `/api/appointments/:id/cancel` | Cancel appointment and delete calendar event |
| POST | `/api/appointments/:id/complete` | Store doctor notes, prescription, and post-visit summary |
| GET | `/api/appointments?role=&userId=` | List appointments |
| POST | `/api/admin/doctors` | Create doctor profile |
| PUT | `/api/admin/doctors/:id` | Update doctor profile |
| POST | `/api/doctors/:id/leave` | Mark leave and cancel affected appointments |
| GET | `/api/cron/reminders?secret=` | Clear expired holds and queue reminders |

## Database Schema

The Prisma schema is in `prisma/schema.prisma`.

Important models:

- `User`: stores patient, doctor, and admin accounts with a `role`
- `Leave`: stores doctor leave dates
- `Appointment`: stores bookings, slot holds, AI summaries, prescriptions, and calendar IDs
- `NotificationLog`: records email/calendar attempts, failures, retries, and errors

Double-booking is prevented by this database rule:

```prisma
@@unique([doctorId, slotStart])
```

## LLM Prompts

Pre-visit summary:

```text
Analyse these symptoms and return ONLY valid JSON with keys:
urgencyLevel ("Low"|"Medium"|"High"), chiefComplaint (string), suggestedQuestions (array of 3 strings).
Symptoms: <symptoms>
```

Post-visit summary:

```text
Convert these clinical notes into a patient-friendly summary. Return ONLY valid JSON with keys:
summary (string, plain language), medicationSchedule (array of {drug, dosage, timing}), followUpSteps (array of strings).
Notes: <notes>
```

Both LLM calls use try/catch and a timeout. If the API fails or no key is configured, the app stores a fallback summary and does not block the booking or visit completion flow.

## Google Calendar Setup

1. Create a Google Cloud project.
2. Enable the Google Calendar API.
3. Create OAuth 2.0 credentials.
4. Generate a refresh token for the clinic or doctor calendar account.
5. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GOOGLE_CALENDAR_ID` to `.env`.

The app creates an event on the connected calendar and adds both the patient and doctor as attendees. On cancellation or doctor leave conflict, it deletes the stored `calendarEventId`.

## System Design Write-up

Double-booking is prevented at two levels. At the database level, the `Appointment` table has a unique constraint on `doctorId` and `slotStart`, so two requests cannot store the same doctor slot twice. At the application level, `/api/appointments/hold` uses a Prisma transaction to remove expired holds and create a new held appointment. If two patients try the same slot at the same time, one request succeeds and the other receives a `409 Slot already taken` response.

The slot hold mechanism uses `status: HELD` and `holdExpiresAt`. When a patient chooses a slot, the app stores a temporary appointment for five minutes. Slot listing treats confirmed appointments and unexpired holds as unavailable. Expired holds can be reclaimed during a new hold request and are also cleaned by the cron endpoint. Confirmation changes the appointment to `CONFIRMED` and clears the expiry field.

Doctor leave conflict handling is implemented in `/api/doctors/:id/leave`. When admin marks a doctor unavailable, the API creates a `Leave` row, finds all held or confirmed appointments for that doctor on that date, marks them `CANCELLED`, creates `LEAVE_CONFLICT` notification logs, attempts to email patients, and deletes related Google Calendar events. This keeps the database, calendar, and patient communication aligned.

Notification reliability is handled through `NotificationLog`. Every email or calendar operation first creates a row with `RETRYING`. On success it becomes `SENT`; on failure the app stores the error, increments attempts, and marks the row `FAILED` after three attempts. The cron endpoint also scans retrying rows. In production, this would be moved to a proper queue such as BullMQ and Redis.

The main three-day trade-offs are deliberate. SQLite keeps setup simple for review, Next.js API routes avoid a separate backend repository, and calendar integration uses one connected clinic or doctor calendar rather than requiring every patient to complete OAuth. Email, calendar, and LLM failures do not crash the core appointment flow, which makes the system safer and easier to demonstrate.
