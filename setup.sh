#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== NeuroLXP SuperAdmin Authentication System Setup ===${NC}\n"

# Check Node.js
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION} installed${NC}\n"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
echo -e "${YELLOW}Checking npm installation...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm ${NPM_VERSION} installed${NC}\n"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL installation...${NC}"
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✓ ${PSQL_VERSION} installed${NC}\n"
else
    echo -e "${RED}✗ PostgreSQL not found. Please install PostgreSQL 13+${NC}"
    exit 1
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}\n"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

# Setup backend database
echo -e "${YELLOW}Setting up PostgreSQL database...${NC}"
psql -U postgres -f prisma/init.sql 2>/dev/null || true

# Run Prisma migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate dev --name init
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migrations completed${NC}\n"
else
    echo -e "${RED}✗ Failed to run migrations${NC}"
    exit 1
fi

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma client generated${NC}\n"
else
    echo -e "${RED}✗ Failed to generate Prisma client${NC}"
    exit 1
fi

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}\n"
else
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}=== Setup Complete ===${NC}\n"
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Start Backend: ${GREEN}cd backend && npm run start:dev${NC}"
echo -e "2. Start Frontend: ${GREEN}cd frontend && npm run dev${NC}"
echo -e "3. Backend URL: ${GREEN}http://localhost:3001${NC}"
echo -e "4. Frontend URL: ${GREEN}http://localhost:3000${NC}"
echo -e "5. API Docs: ${GREEN}http://localhost:3001/api/docs${NC}\n"

echo -e "${YELLOW}Database Credentials:${NC}"
echo -e "Host: ${GREEN}localhost${NC}"
echo -e "Port: ${GREEN}5432${NC}"
echo -e "Database: ${GREEN}neurolxp_auth_db${NC}"
echo -e "User: ${GREEN}admin${NC}"
echo -e "Password: ${GREEN}admin123${NC}\n"

echo -e "${YELLOW}Important:${NC}"
echo -e "- Change JWT_SECRET in backend/.env to a secure value"
echo -e "- Update database credentials in backend/.env"
echo -e "- Configure email service for OTP delivery"
echo -e "- Test 2FA setup with Google Authenticator"
