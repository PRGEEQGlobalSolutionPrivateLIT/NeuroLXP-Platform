# Backend README

## Development Setup

### Quick Start
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

## Endpoints

### Health Check
- `GET /api/health` - Health check
- `GET /api/status` - System status

### Signup Endpoints
- `POST /api/auth/signup/initialize` - Start signup process
- `POST /api/auth/signup/step-progress/:sessionId/:step` - Update step progress
- `POST /api/auth/signup/complete` - Complete signup with all data
- `GET /api/auth/signup/progress/:sessionId` - Get signup progress
- `DELETE /api/auth/signup/cancel/:sessionId` - Cancel signup

### Signin & Recovery Endpoints
- `POST /api/auth/signin/primary` - Primary login (email/phone/userId + password)
- `POST /api/auth/signin/select-otp-method/:sessionId` - Select OTP delivery method
- `POST /api/auth/signin/verify-otp/:sessionId` - Verify OTP code
- `POST /api/auth/signin/verify-authenticator/:sessionId/:superAdminId` - Verify TOTP
- `POST /api/auth/signin/verify-recovery-code/:sessionId/:superAdminId` - Verify recovery code
- `POST /api/auth/signin/verify-backup-code/:sessionId/:superAdminId` - Verify backup code
- `GET /api/auth/signin/security-question/:superAdminId` - Get security question
- `POST /api/auth/signin/verify-security-question/:sessionId/:superAdminId` - Verify security question
- `POST /api/auth/signin/verify-government-id/:sessionId/:superAdminId` - Verify government ID
- `POST /api/auth/signin/request-approval/:sessionId/:superAdminId` - Request secondary approval
- `POST /api/auth/signin/verify-approval/:sessionId/:superAdminId` - Verify approval code
- `POST /api/auth/signin/complete/:sessionId/:superAdminId` - Complete signin

### Recovery Endpoints
- `GET /api/auth/recovery/options/:superAdminId` - Get available recovery options
- `GET /api/auth/recovery/lock-status/:superAdminId` - Check account lock status
- `GET /api/auth/recovery/backup-codes-count/:superAdminId` - Get count of unused backup codes

## Database Commands

### Generate Prisma Client
```bash
npx prisma generate
```

### Create/Run Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Prisma Studio
```bash
npx prisma studio
```

## Security Notes

- Password hashing uses Argon2 with high security parameters
- JWT tokens expire in 15 minutes (configurable)
- Refresh tokens valid for 7 days (configurable)
- Account locks after 5 failed login attempts
- All sensitive operations are audit logged
- Email notifications sent for critical events

## Key Services

### PasswordService
- `hashPassword(password: string)` - Hash with Argon2
- `verifyPassword(password: string, hash: string)` - Verify password

### OtpService
- `generateTotpSecret(email)` - Generate Google Authenticator secret
- `verifyTotp(secret, token)` - Verify TOTP token
- `generateOtp()` - Generate 6-digit OTP
- `generateRecoveryCode()` - Generate recovery code
- `generateBackupCodes(count)` - Generate backup codes
- `generateApprovalCode()` - Generate approval code

### AuthenticationService
- `createAccessToken(superAdminId)` - Create JWT access token
- `createRefreshToken(superAdminId)` - Create refresh token
- `createSession(superAdminId, refreshToken)` - Create user session
- `refreshAccessToken(refreshToken)` - Refresh expired access token

## Environment Configuration

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRATION` - Access token expiry (default: 15m)
- `JWT_REFRESH_EXPIRATION` - Refresh token expiry (default: 7d)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend domain for CORS

## Testing with API Docs

Access Swagger UI at: `http://localhost:3001/api/docs`

All endpoints are documented with request/response schemas.

## Troubleshooting

### Database Connection Error
Ensure PostgreSQL is running and `DATABASE_URL` in `.env` is correct.

### Migration Errors
```bash
# Reset and retry
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Port in Use
Change `PORT` in `.env` or kill process using port 3001.

## Production Build

```bash
npm run build
npm run start:prod
```
