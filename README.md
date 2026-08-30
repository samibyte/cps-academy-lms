# CPS-LMS: Learning Management System

A Learning Management System built with Next.js (frontend) and Strapi (backend) on PostgreSQL. Supports course management, student enrollment, progress tracking, quizzes, and role-based access control.

## 🛠 Tech Stack

- **Frontend:** Next.js, React, TypeScript, TailwindCSS
- **Backend:** Strapi, Node.js, PostgreSQL
- **Hosting:** Vercel (frontend), Railway (backend)

## 👥 User Roles

- **Admin** - Full platform control, manage users, all content
- **Content Manager** - Create/edit/delete courses and lessons
- **Instructor** - Manage own courses, view student progress
- **Student** - Enroll in courses, complete lessons, take quizzes

---

## ✨ Features

- **Authentication** - User registration and login with role assignment
- **Course Management** - Create, edit, delete courses (by role)
- **Lessons** - Add lessons to courses with text/video content
- **Enrollment** - Students can enroll in courses
- **Progress Tracking** - Students can mark lessons complete, track progress percentage
- **Quizzes** - Create MCQ quizzes with auto-grading and score storage
- **Admin Panel** - User management, view all courses/lessons
- **Blog** - Admin and Content Manager can create and publish blog posts

---

## 📁 Project Structure

```
cps-lms/
├── client/              # Next.js Frontend
│   ├── src/
│   │   ├── app/        # Next.js pages and layouts
│   │   ├── components/ # Reusable React components
│   │   ├── lib/        # Utilities and helpers
│   │   └── services/   # API calls
│   └── package.json
│
└── server/             # Strapi Backend
    ├── config/         # Strapi configuration
    ├── src/
    │   ├── api/        # API endpoints
    │   └── policies/   # Permission policies
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+)
- pnpm

### Local Setup

1. **Clone and install:**

```bash
git clone <repo-url>
cd cps-lms
cd client && pnpm install
cd ../server && pnpm install
```

2. **Database:**

```bash
createdb cps_lms_dev
```

3. **Environment variables:**

Frontend (client/.env.local):

```
NEXT_PUBLIC_API_URL=http://localhost:1337
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Backend (server/.env):

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cps_lms_dev
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
JWT_SECRET=your-secret-key
PORT=1337
NODE_ENV=development
```

4. **Run:**

```bash
# Backend
cd server && pnpm develop

# Frontend (new terminal)
cd client && pnpm dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:1337

---

## � Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

Set environment variables in Vercel dashboard:

- `NEXT_PUBLIC_API_URL` = Backend URL
- `NEXT_PUBLIC_APP_URL` = Frontend URL

### Backend (Railway)

```bash
railway login
railway init
railway up
```

Configure database and environment variables in Railway dashboard.

---

## 🐛 Troubleshooting

**Can't connect to database:**

- Ensure PostgreSQL is running
- Check `.env` connection string
- Verify database exists: `psql -l`

**401 Unauthorized errors:**

- Verify JWT token is valid
- Check `Authorization: Bearer {token}` header format
- Re-login and retry

**403 Forbidden errors:**

- Verify user role has permission
- Check if user is enrolled in course (for students)
- Ensure instructor owns the course

**Frontend can't reach backend:**

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS in Strapi
- Ensure backend is running

---

**Status:** Production Ready  
**Frontend:** [Vercel](https://cps-academy-lms-psi.vercel.app/)  
**Backend:** [Railway](https://cps-academy-production.up.railway.app/)
