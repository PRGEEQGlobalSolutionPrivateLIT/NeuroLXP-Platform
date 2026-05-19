# NeuroLXP SuperAdmin Authentication System - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Automatic Setup](#automatic-setup)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Testing the System](#testing-the-system)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

## Prerequisites

### System Requirements
- Windows 10+, macOS 10.14+, or Linux (Ubuntu 20.04+)
- 4GB RAM minimum, 8GB recommended
- 500MB free disk space
- Administrator access for PostgreSQL installation

### Required Software
1. **Node.js** (v18.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **PostgreSQL** (v13 or higher)
   - Download from: https://www.postgresql.org/download/
   - Choose your operating system
   - Remember the password you set for the postgres user

3. **Git** (Optional, for cloning)
   - Download from: https://git-scm.com/

### Verify Installations
```bash
# Check Node.js
node --version
npm --version

# Check PostgreSQL (should show version)
psql --version
```

## Automatic Setup

### For Windows Users

1. Navigate to project folder
2. Double-click `setup.bat`
3. Follow the prompts
4. When complete, you'll see:
   ```
   Setup Complete!
   Next Steps:
   1. Start Backend: cd backend && npm run start:dev
   2. Start Frontend: cd frontend && npm run dev
   ```

### For Linux/Mac Users

1. Navigate to project folder
2. Open terminal and run:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
3. When complete, you'll see the startup instructions

## Manual Setup

### Step 1: Create and Configure PostgreSQL Database

#### Windows CMD:
```bash
# Open Command Prompt as Administrator
psql -U postgres

# In psql prompt, run:
CREATE DATABASE neurolxp_auth_db;
CREATE USER admin WITH ENCRYPTED PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE neurolxp_auth_db TO admin;
\q
```

#### macOS/Linux Terminal:
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In psql prompt, run:
CREATE DATABASE neurolxp_auth_db;
CREATE USER admin WITH ENCRYPTED PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE neurolxp_auth_db TO admin;
ALTER ROLE admin SET client_encoding TO 'utf8';
ALTER ROLE admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE admin SET default_transaction_deferrable TO on;
\q
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Verify setup
npx prisma studio
# This opens Prisma Studio to view the database structure
# Press Ctrl+C to close
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Verify installation
npm run build
```

## Configuration

### Backend Configuration

1. Open `backend/.env`
2. Review and update if needed:

```env
# Database Connection
DATABASE_URL="postgresql://admin:admin123@localhost:5432/neurolxp_auth_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-change-this-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Environment
NODE_ENV="development"
PORT=3001

# URLs
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
```

**Important**: For production, change `JWT_SECRET` to a long random string:
```bash
# Generate a secure secret (on Linux/Mac)
openssl rand -base64 32

# On Windows, use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Configuration

1. Open `frontend/.env.local`
2. Verify setting:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

This tells the frontend where your backend is running.

## Verification

### Backend Health Check

1. Start backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Open browser and visit:
   - http://localhost:3001/api/health
   - Should return: `"Super Admin Authentication System API - v1.0.0"`

3. Access Swagger API docs:
   - http://localhost:3001/api/docs

### Frontend Health Check

1. In new terminal, start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser and visit:
   - http://localhost:3000
   - You should see the NeuroLXP homepage

### Database Connection Check

```bash
cd backend
npx prisma studio
# Opens database visualization tool
# Verify tables are created
# Press Ctrl+C to close
```

## Testing the System

### Complete Signup Flow

1. Go to http://localhost:3000
2. Click "Create Account"
3. Fill out all 14 steps:
   - Step 1: Basic Information
   - Step 2: Alternative Contact
   - Step 3: Password (e.g., `TestPass123!@`)
   - Step 4: Security Question
   - Step 5: Government ID
   - Step 6: Secondary Approver
   - Step 7: Review
   - Step 8-14: Verify and complete

4. After completion, you'll see recovery codes and backup codes
5. **Save these codes** - you'll need them for testing signin

### Test Credentials Example
```
Full Name: Test Admin
Primary Email: test@example.com
Primary Phone: 9876543210
Password: TestPass123!@
Security Question: What is your pet's name?
Security Question Answer: Fluffy
Government ID Type: Aadhaar
Government ID Number: 12345678901234
Secondary Approver Name: John Doe
Secondary Approver Designation: Manager
Secondary Approver Phone: 9123456789
Secondary Approver Email: john@example.com
Alternative Email: alt@example.com
Alternative Phone: 9999999999
```

### Complete Signin Flow

1. Go to http://localhost:3000
2. Click "Sign In"
3. Enter credentials from signup
4. Complete multi-factor authentication:
   - Step 1: Primary authentication
   - Step 2: OTP (select email or phone)
   - Step 3: Google Authenticator code
   - Step 4: Recovery code (new one generated)
   - Step 5: Backup code
   - Step 6: Security question answer
   - Step 7: Government ID verification
   - Step 8: Secondary approver approval

5. Upon success, redirected to dashboard

## Troubleshooting

### Common Issues

#### 1. PostgreSQL Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Start PostgreSQL service:
  - Windows: Services → PostgreSQL → Start
  - Mac: `brew services start postgresql`
  - Linux: `sudo systemctl start postgresql`
- Verify credentials in `.env`

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:**
- Find and kill process:
  ```bash
  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -i :3001
  kill -9 <PID>
  ```
- Or change PORT in backend/.env

#### 3. Database Migration Failed
```
Error: P1000 [ERROR_SET_NOT_FOUND] Can't reach database server
```
**Solution:**
```bash
cd backend
# Reset database (warning: deletes all data)
npx prisma migrate reset

# Try again
npx prisma migrate dev --name init
```

#### 4. Module Not Found
```
Error: Cannot find module '@prisma/client'
```
**Solution:**
```bash
cd backend
npx prisma generate
npm install
```

#### 5. Frontend Won't Connect to Backend
- Check NEXT_PUBLIC_API_URL in frontend/.env.local
- Verify backend is running on http://localhost:3001
- Check browser console for CORS errors

### Debug Mode

#### Backend Debug
```bash
cd backend
DEBUG=* npm run start:dev
```

#### Frontend Debug
```bash
cd frontend
npm run dev
```

Both outputs will show detailed logs in terminal.

#### Database Debug
```bash
cd backend
npx prisma studio
```

### Check Logs

```bash
# Backend logs
cd backend
npm run start:dev 2>&1 | tee debug.log

# Frontend logs  
cd frontend
npm run dev 2>&1 | tee debug.log
```

## Next Steps

### After Successful Setup

1. **Explore the System**
   - Test all 14 signup steps
   - Test all 8 signin recovery steps
   - Check audit logs in database

2. **Customize**
   - Update branding in frontend
   - Customize email templates
   - Configure additional security parameters

3. **Production Deployment**
   - Generate strong JWT_SECRET
   - Set NODE_ENV=production
   - Configure real email service (SMTP)
   - Set up database backups
   - Enable HTTPS/SSL
   - Deploy to your server

4. **Learn More**
   - Read backend/README.md for API details
   - Read frontend/README.md for component details
   - Check database schema in backend/prisma/schema.prisma

### Project Structure Reference

```
NeuroLXP-Platform/
├── backend/               # NestJS backend
│   ├── src/              # Source code
│   ├── prisma/           # Database schema
│   ├── package.json      # Dependencies
│   ├── .env              # Configuration
│   └── README.md         # Backend docs
├── frontend/             # Next.js frontend
│   ├── src/              # Source code
│   ├── public/           # Static files
│   ├── package.json      # Dependencies
│   ├── .env.local        # Configuration
│   └── README.md         # Frontend docs
├── setup.sh              # Auto setup (Linux/Mac)
├── setup.bat             # Auto setup (Windows)
└── README.md             # Main documentation
```

### Key Commands

```bash
# Backend
cd backend
npm run start:dev         # Start development server
npm run build             # Build for production
npm run start:prod        # Start production server
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Run migrations

# Frontend
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Check code quality
npm run type-check       # Type checking
```

## Support

For additional help:
1. Check README.md files in each directory
2. Review API documentation at http://localhost:3001/api/docs
3. Check database schema at backend/prisma/schema.prisma
4. Review error logs in terminal output

## Security Checklist

Before going to production:
- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Configure SMTP for real emails
- [ ] Set up database backups
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Test all authentication flows
- [ ] Review audit logs
- [ ] Create admin recovery procedures

---

**Congratulations!** Your enterprise-grade authentication system is now ready! 🎉
