@echo off
REM Colors for Windows cmd
setlocal enabledelayedexpansion

echo ========================================
echo NeuroLXP SuperAdmin Authentication Setup
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK: Node.js !NODE_VERSION! installed
echo.

REM Check npm
echo Checking npm installation...
where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm not found
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo OK: npm !NPM_VERSION! installed
echo.

REM Check PostgreSQL
echo Checking PostgreSQL installation...
where psql >nul 2>nul
if errorlevel 1 (
    echo ERROR: PostgreSQL not found. Please install PostgreSQL 13+
    exit /b 1
)
echo OK: PostgreSQL installed
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)
echo OK: Backend dependencies installed
echo.

REM Run Prisma migrations
echo Running database migrations...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ERROR: Failed to run migrations
    exit /b 1
)
echo OK: Database migrations completed
echo.

REM Generate Prisma client
echo Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    exit /b 1
)
echo OK: Prisma client generated
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)
echo OK: Frontend dependencies installed
echo.

cd ..

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Start Backend: cd backend ^&^& npm run start:dev
echo 2. Start Frontend: cd frontend ^&^& npm run dev
echo 3. Backend URL: http://localhost:3001
echo 4. Frontend URL: http://localhost:3000
echo 5. API Docs: http://localhost:3001/api/docs
echo.
echo Database Credentials:
echo Host: localhost
echo Port: 5432
echo Database: neurolxp_auth_db
echo User: admin
echo Password: admin123
echo.
echo Important:
echo - Change JWT_SECRET in backend\.env to a secure value
echo - Update database credentials in backend\.env if needed
echo - Configure email service for OTP delivery
echo - Test 2FA setup with Google Authenticator
echo.
pause
