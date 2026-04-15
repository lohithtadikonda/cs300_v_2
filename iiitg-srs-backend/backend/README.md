# IIITG Semester Registration System - Backend

## Setup

1. **Install PostgreSQL** and create the database:
```bash
createdb iiitg_srs
psql -d iiitg_srs -f sql/schema.sql
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

4. **Run the server**:
```bash
npm run dev    # development (with hot reload)
npm start      # production
```

Server runs on `http://localhost:5000`

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (email + password) |
| GET | `/api/auth/profile` | Get current user profile |

### Courses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/courses` | Any | List active courses |
| POST | `/api/courses` | Admin | Create course |
| PUT | `/api/courses/:id` | Admin | Update course |
| DELETE | `/api/courses/:id` | Admin | Deactivate course |

### Registrations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/registrations` | Student | Create registration |
| GET | `/api/registrations/my` | Student | Get my registrations |
| GET | `/api/registrations/all` | Staff | Get all (role-filtered) |
| POST | `/api/registrations/:id/approve` | Staff | Approve/reject |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/settings` | Admin | Get system settings |
| PUT | `/api/admin/settings` | Admin | Update settings |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users` | Admin | Create user |

## Demo Credentials
All demo accounts use password: `demo`
- student@iiitg.ac.in
- warden@iiitg.ac.in
- finance@iiitg.ac.in
- studentaffairs@iiitg.ac.in
- academic@iiitg.ac.in
- admin@iiitg.ac.in
