# VakilDesk — Architecture & Feature Roadmap

## Overview
VakilDesk is a legal practice management app for lawyers and their clients.
Stack: Django REST Framework (backend) + React Native / Expo (mobile).

---

## Current Tech Stack

| Layer       | Technology                                   |
|-------------|----------------------------------------------|
| Backend     | Django 6, DRF, simplejwt, PostgreSQL          |
| Mobile      | React Native, Expo SDK 54, Expo Router 6      |
| Auth        | JWT (access 1h, refresh 7d) via AsyncStorage  |
| Networking  | Axios with async Bearer-token interceptor     |
| Navigation  | Expo Router file-based: `(auth)/`, `(app)/`   |

---

## Repository Layout

```
vakilDesk/
├── backend/
│   ├── config/           # Django settings, root URLs, wsgi/asgi
│   ├── users/            # Custom User model + auth APIs
│   ├── cases/            # Case model + CRUD APIs
│   └── requirements.txt
└── mobile/
    ├── app.json          # Expo config (SDK 54, plugins)
    ├── src/
    │   ├── app/
    │   │   ├── _layout.tsx          # Root: AuthProvider + redirect guard
    │   │   ├── (auth)/              # login, register, forgot-password, reset-password
    │   │   └── (app)/               # dashboard, cases, new-case, case-detail,
    │   │                            # edit-profile, admin
    │   ├── components/ui/           # FormInput, PasswordInput, PrimaryButton,
    │   │                            # AlertBox, Avatar, StatCard, ActionCard,
    │   │                            # Badge, DateInput
    │   ├── constants/colors.ts      # C palette (primary #1a2744, accent #c9a847)
    │   ├── context/AuthContext.tsx  # isAuthed (null|bool), login(), logout()
    │   └── utils/
    │       ├── api.ts               # Axios instance, LAN IP auto-detection
    │       └── auth.ts              # AsyncStorage token helpers
    └── assets/
```

---

## Backend: Current Data Models

### User (users.User — extends AbstractUser)
| Field         | Type                              |
|---------------|-----------------------------------|
| username      | CharField (unique)                |
| email         | EmailField (unique)               |
| first_name    | CharField                         |
| last_name     | CharField                         |
| phone         | CharField                         |
| role          | CharField: admin / lawyer / client|
| is_active     | BooleanField                      |
| profile_picture | ImageField (to be added)        |

### Case (cases.Case)
| Field          | Type                                    |
|----------------|-----------------------------------------|
| lawyer         | FK → User                               |
| case_name      | CharField                               |
| case_number    | CharField                               |
| under_section  | CharField (U/S)                         |
| police_station | CharField (P/S)                         |
| next_date      | DateField                               |
| previous_date  | DateField (auto-shifted from next_date) |
| payment_status | pending / partial / paid                |
| fee_amount     | DecimalField                            |
| paid_amount    | DecimalField                            |
| notes          | TextField                               |

---

## Current API Endpoints

```
POST   /api/register/
POST   /api/login/                  (JWT pair)
POST   /api/token/refresh/
GET    /api/profile/
PATCH  /api/profile/
GET    /api/users/                  (admin only)
GET    /api/users/<id>/             (admin only)
POST   /api/users/<id>/toggle-active/
POST   /api/password-reset/request/
POST   /api/password-reset/confirm/

GET    /api/cases/
POST   /api/cases/
GET    /api/cases/<id>/
PATCH  /api/cases/<id>/
DELETE /api/cases/<id>/
```

---

## Current Mobile Screens

| Screen              | Route                    | Who sees it   |
|---------------------|--------------------------|---------------|
| Login               | (auth)/login             | All           |
| Register            | (auth)/register          | All           |
| Forgot Password     | (auth)/forgot-password   | All           |
| Reset Password      | (auth)/reset-password    | All           |
| Dashboard           | (app)/dashboard          | Lawyer/Admin  |
| My Cases            | (app)/cases              | Lawyer        |
| New Case            | (app)/new-case           | Lawyer        |
| Case Detail         | (app)/case-detail        | Lawyer        |
| Edit Profile        | (app)/edit-profile       | All           |
| Admin Panel         | (app)/admin              | Admin only    |

---

## Feature Roadmap (Prioritised)

### Phase 1 — Core Gaps (Build Next)

#### 1.1 Case Edit Screen
- Missing: lawyer can create a case but cannot edit case_name, U/S, P/S, notes after creation
- Screen: `(app)/edit-case.tsx`
- Reuses DateInput component for next_date

#### 1.2 Case Status Field
- Add `status` field to Case model: open / adjourned / disposed / on-hold
- Show status badge on cases list and detail

#### 1.3 Court Information on Case
- Add `court_name`, `court_type` (District / High Court / Supreme Court / Tribunal), `judge_name` fields to Case model
- Show on case detail, filter by court on cases list

#### 1.4 Client Management
- Backend: `clients` app with `ClientProfile` model linked 1:1 to User(role=client)
  - Additional fields: address, aadhar_number (optional), notes
- Linking: `Case.clients` ManyToMany through `CaseClient`
- API: CRUD for client profiles, link/unlink from case
- Mobile screens:
  - `(app)/clients.tsx` — searchable client list
  - `(app)/new-client.tsx` — create client (creates User + ClientProfile)
  - `(app)/client-detail.tsx` — client info + linked cases

---

### Phase 2 — Hearing Management

#### 2.1 Hearing History per Case
- Backend: `HearingRecord` model (case FK, date, outcome, notes, next_date_set)
- Every time next_date changes → system creates a HearingRecord automatically
- API: `GET /api/cases/<id>/hearings/`
- Mobile: hearing timeline inside case-detail

#### 2.2 Calendar / Schedule View
- Mobile screen: `(app)/calendar.tsx`
- Groups all cases by next_date into a calendar
- Tap a date → list of hearings that day

#### 2.3 Cause List (Daily View)
- Dashboard widget: "Today's Hearings" — list of cases with next_date = today
- Replace the "Hearing Today" stat card with a tappable list

---

### Phase 3 — Document Management

#### 3.1 Backend Document Model
- `Document` model: case FK, uploaded_by FK, file (FileField), doc_type, title, uploaded_at
- API: upload, list, delete per case

#### 3.2 Mobile Document Screens
- Document list inside case-detail (tab or section)
- Upload: expo-document-picker or expo-image-picker
- View/download

---

### Phase 4 — Client Portal

#### 4.1 Role-Based Dashboard
- If `role === 'client'`: show client dashboard instead of lawyer dashboard
- Client dashboard shows: their linked cases, upcoming dates, payment balance

#### 4.2 Client Case View (Read-Only)
- `(app)/client-case-detail.tsx`
- Client can see: case name, next date, payment status, lawyer name, documents
- Cannot edit anything

#### 4.3 Client Payment View
- Client sees: fee amount, paid, balance due
- History of payments

---

### Phase 5 — Billing & Invoices

#### 5.1 Backend Invoice Model
- `Invoice` model: case FK, amount, description, issue_date, due_date, status (draft/sent/paid)
- `Payment` model: invoice FK, amount, payment_date, method, notes

#### 5.2 Mobile Invoice Screens
- `(app)/invoices.tsx` — invoice list per case or all
- `(app)/new-invoice.tsx` — create invoice
- `(app)/invoice-detail.tsx` — view, record payment

---

### Phase 6 — Notifications & Messaging

#### 6.1 Push Notifications
- expo-notifications for hearing reminders (1 day before next_date)
- Backend: scheduled job (celery or django-apscheduler) to trigger

#### 6.2 In-App Messaging
- `Message` model: sender FK, receiver FK, case FK (optional), text, timestamp, is_read
- Mobile: `(app)/messages.tsx` — inbox
- `(app)/conversation.tsx` — per-thread chat

---

## Design Tokens (colors.ts — C object)

| Token      | Value     | Usage                        |
|------------|-----------|------------------------------|
| primary    | #1a2744   | Headers, buttons, nav bars   |
| accent     | #c9a847   | Highlights, badges, CTAs     |
| bg         | #f5f4f1   | Screen backgrounds           |
| text       | #1a1a2e   | Body text                    |
| textMuted  | #6b7280   | Labels, secondary text       |
| error      | #dc2626   | Validation errors            |
| success    | #059669   | Success states               |

---

## Auth Flow

```
App start
  └─ isAuthed === null  →  spinner
  └─ isAuthed === false →  /(auth)/login
  └─ isAuthed === true  →  /(app)/dashboard (or client dashboard)

Login → POST /api/login/ → store access + refresh in AsyncStorage
Every API request → interceptor attaches Bearer token
Token expired → 401 → logout → redirect to login
```

---

## Key Conventions

- All API calls go through `mobile/src/utils/api.ts` (Axios instance)
- JWT tokens stored in AsyncStorage (keys: `access_token`, `refresh_token`)
- Profile picture stored locally in AsyncStorage as URI (not uploaded to backend yet)
- DateInput uses pure-JS FlatList picker (no native modules) → works in Expo Go
- `previous_date` auto-shifts in Django serializer `update()` when `next_date` changes
- Colors always use `C.*` from `constants/colors.ts` — never hardcode hex values
- Admin-only features guarded by `profile.role === 'admin' || profile.is_staff`

