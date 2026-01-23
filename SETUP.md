# Blood Donation Management System - Setup Guide

## Prerequisites

1. Node.js 18+ and pnpm installed
2. Supabase account and project
3. Database credentials from Supabase

## Setup Steps

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with your database connection string:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

**Getting your database URL from Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **Database**
3. Under **Connection string**, select **URI** format
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Paste it into `.env.local` as `DATABASE_URL`

**Note:** For Prisma 7, you only need `DATABASE_URL`. The `DIRECT_URL` and Supabase client variables are optional.

### 3. Initialize Database

Run Prisma commands to create the database schema:

```bash
# Generate Prisma Client (already done, but run again if needed)
pnpm prisma generate

# Push schema to database (creates tables in your Supabase database)
pnpm prisma db push
```

**Note:** Make sure your `.env.local` file has the correct `DATABASE_URL` before running `prisma db push`.

### 4. Configure Row Level Security (RLS)

Run the SQL commands from `prisma/rls-policies.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `prisma/rls-policies.sql`
3. Execute the SQL

This will:
- Enable RLS on the Donor table
- Allow public read access
- Allow public insert access
- Restrict update/delete (commented out by default)

### 5. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components
- `/lib` - Utility functions (parser, validation, prisma client)
- `/prisma` - Database schema and migrations

## Features

- **Dashboard** (`/`) - View statistics and donor records
- **Submit Donor** (`/submit`) - Add donors via form or paste format
- **Reports** (`/reports`) - Generate custom reports with filters

## Notes

- The system accepts dates in DD-MM-YY or DD-MM-YYYY format
- Phone numbers must be in Bangladesh format (01XXXXXXXXX or +8801XXXXXXXXX)
- Blood groups: A+, A-, B+, B-, AB+, AB-, O+, O-
- Default values for batch and hospital are "Unknown" if not provided

