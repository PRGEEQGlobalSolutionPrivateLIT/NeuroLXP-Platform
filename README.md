# NeuroLXP SuperAdmin Authentication System

## Overview

A complete enterprise-grade Super Admin Signup & Multi-Step Secure Signin & Recovery Authentication System built with Next.js, NestJS, TypeScript, and PostgreSQL.

## Features

### 14-Step Secure Signup Process
1. **Basic Information** - Full Name, Primary Email, Phone
2. **Alternative Contact** - Backup Email & Phone  
3. **Password Setup** - Strong password with validation
4. **Security Question** - Custom security question & answer
5. **Government ID** - Verify ID type and number
6. **Secondary Approver** - Designate approval authority
7. **Review Information** - Verify all entered data
8. **Google Authenticator Setup** - Configure 2FA
9. **Authenticator Verification** - Verify the generated code
10. **Backup Codes** - Generate and save 9 backup codes
11. **Recovery Code** - Generate and save recovery code
12. **Final Security Setup** - Confirm all security measures
13. **Final Review** - Last chance to verify everything
14. **Account Created** - Success confirmation

### 8-Step Multi-Factor Authentication Recovery

1. **Primary Login** - Email/Phone/UserID + Password
2. **Alternative Contact OTP** - Verify via alternative email/phone
3. **Google Authenticator** - Verify TOTP code
4. **Recovery Code** - Verify recovery code (generates new one)
5. **Backup Code** - Use one of 9 backup codes
6. **Security Question** - Answer security question
7. **Government ID** - Verify government ID
8. **Secondary Approval** - Request and verify approver authorization

### Security Features
- ✓ Argon2 password hashing
- ✓ JWT authentication with refresh tokens
- ✓ Google Authenticator TOTP
- ✓ Backup and recovery codes
- ✓ Rate limiting and attempt tracking
- ✓ Account locking after failed attempts
- ✓ Secure session management
- ✓ Audit logging
- ✓ Email notifications
- ✓ XSS protection with Helmet
- ✓ CORS enabled
- ✓ Input validation with Zod

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **HTTP**: Axios
- **Icons**: Lucide React

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT + Passport.js
- **Password Hashing**: Argon2
- **TOTP**: Speakeasy
- **Email**: Nodemailer
- **Validation**: Class Validator
- **Security**: Helmet
- **API Docs**: Swagger/OpenAPI

### Database
- **PostgreSQL** 13+
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

## Project Structure

```
NeuroLXP-Platform/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   └── modules/
│   │       ├── auth/
│   │       ├── signup/
│   │       ├── signin/
│   │       ├── recovery/
│   │       └── audit/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── init.sql
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── auth/
│   │   │   └── dashboard/
│   │   ├── components/
│   │   ├── lib/
│   │   └── store/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── next.config.js
│   ├── .env.local
│   └── .env.example
├── setup.sh
├── setup.bat
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 13+
- Git

### Quick Start (Windows)
```bash
setup.bat
```

### Quick Start (Linux/Mac)
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### 1. Database Setup
```bash
psql -U postgres
CREATE DATABASE neurolxp_auth_db;
CREATE USER admin WITH ENCRYPTED PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE neurolxp_auth_db TO admin;
\q
```

#### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
cp .env.example .env
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## Running the Application

### Start Backend
```bash
cd backend
npm run start:dev
```
Backend: `http://localhost:3001`
API Docs: `http://localhost:3001/api/docs`

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend: `http://localhost:3000`

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://admin:admin123@localhost:5432/neurolxp_auth_db"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
NODE_ENV="development"
PORT=3001
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /api/auth/signup/initialize` - Initialize signup
- `POST /api/auth/signup/complete` - Complete signup
- `POST /api/auth/signin/primary` - Primary login
- `POST /api/auth/signin/verify-otp` - Verify OTP
- `POST /api/auth/signin/verify-authenticator` - Verify TOTP
- `POST /api/auth/signin/verify-recovery-code` - Verify recovery code
- `POST /api/auth/signin/verify-backup-code` - Verify backup code
- `POST /api/auth/signin/verify-security-question` - Verify security question
- `POST /api/auth/signin/verify-government-id` - Verify government ID
- `POST /api/auth/signin/request-approval` - Request secondary approval
- `POST /api/auth/signin/verify-approval` - Verify approval code
- `POST /api/auth/signin/complete` - Complete signin

### Recovery
- `GET /api/auth/recovery/options/:superAdminId` - Get recovery options
- `GET /api/auth/recovery/lock-status/:superAdminId` - Check account lock
- `GET /api/auth/recovery/backup-codes-count/:superAdminId` - Count backup codes

## Security Implementation

### Password Security
- Minimum 8 characters with uppercase, lowercase, number, special char
- Argon2 hashing with high security parameters
- Never stored in plain text

### Multi-Factor Authentication
- Google Authenticator TOTP (time-based one-time password)
- 9 one-time-use backup codes
- Recovery code with new generation on use
- Security question and answer verification
- Government ID verification
- Secondary approver authorization

### Account Protection
- Account locking after 5 failed attempts (5-hour lockout)
- Separate attempt counters per authentication method
- Session-based authentication with expiration
- Audit logging of all activities
- Email notifications for critical events

## Database Schema

### SuperAdmin
Core user table with all signup and authentication data

### BackupCode
9 unique codes for emergency access (one-time use)

### Session
Active sessions with refresh tokens

### OtpLog
OTP generation and verification tracking

### RecoveryCode
Recovery codes with version history

### ApprovalRequest
Secondary approver authorization requests

### AuditLog
Complete audit trail of all system activities

### AuthenticationProgress
Multi-step authentication session state

## Production Deployment

### Before Going Live
1. Generate strong JWT_SECRET
2. Set NODE_ENV=production
3. Configure real email service (SMTP)
4. Set up database backups
5. Enable HTTPS/SSL
6. Configure production CORS
7. Use strong database credentials
8. Enable rate limiting
9. Set up monitoring

## Support & Documentation

For detailed setup instructions, API documentation, and troubleshooting, refer to the README in each folder:
- Backend: `backend/README.md` (to be created)
- Frontend: `frontend/README.md` (to be created)