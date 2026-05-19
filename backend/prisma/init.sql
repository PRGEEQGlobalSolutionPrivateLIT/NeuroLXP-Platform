-- Create PostgreSQL database
CREATE DATABASE neurolxp_auth_db;

-- Connect to the database and create extensions
\c neurolxp_auth_db;

-- Create admin user
CREATE USER admin WITH ENCRYPTED PASSWORD 'admin123';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE neurolxp_auth_db TO admin;
