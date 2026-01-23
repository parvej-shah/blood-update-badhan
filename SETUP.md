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

Create a `.env.local` file in the root directory with your database connection string and Telegram bot configuration:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

# Telegram Bot Configuration (Optional)
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
TELEGRAM_WEBHOOK_URL="https://yourdomain.com/api/telegram/webhook"
TELEGRAM_ALLOWED_GROUP_IDS="123456789,-987654321"
TELEGRAM_WEBHOOK_SECRET="your_optional_webhook_secret"
NEXT_PUBLIC_API_URL="https://yourdomain.com"

# AI Parsing Configuration (Optional - for unstructured data parsing)
GEMINI_API_KEY="your_gemini_api_key"
DEEPSEEK_API_KEY="your_deepseek_api_key"
USE_AI_PARSING="true"
```

**Getting your database URL from Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **Database**
3. Under **Connection string**, select **URI** format
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Paste it into `.env.local` as `DATABASE_URL` and `DIRECT_URL`

**Note:** For Prisma 7, you need both `DATABASE_URL` (for connection pooling) and `DIRECT_URL` (for migrations).

**Telegram Bot Setup (Optional):**
1. Create a bot by messaging [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command and follow instructions
3. Copy the bot token and add it as `TELEGRAM_BOT_TOKEN`
4. Add your webhook URL (after deployment) as `TELEGRAM_WEBHOOK_URL`
5. Optionally restrict bot to specific groups by adding their chat IDs to `TELEGRAM_ALLOWED_GROUP_IDS` (comma-separated)
6. Set `NEXT_PUBLIC_API_URL` to your deployed domain (e.g., `https://your-app.vercel.app`)

**AI Parsing Setup (Optional - for unstructured data):**
The system can automatically parse unstructured donor information using AI when the regex parser fails. You can use either Google Gemini or DeepSeek (or both for fallback).

1. **Google Gemini (Free tier available):**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key
   - Add it as `GEMINI_API_KEY` in `.env.local`

2. **DeepSeek (Free API):**
   - Go to [DeepSeek Platform](https://platform.deepseek.com/)
   - Create an account and get an API key
   - Add it as `DEEPSEEK_API_KEY` in `.env.local`

3. **Configuration:**
   - Set `USE_AI_PARSING="true"` to enable AI parsing (default: true)
   - If both API keys are provided, the system will try Gemini first, then DeepSeek as fallback
   - AI parsing is only used when regex parsing fails or unstructured text is detected

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
- **Telegram Bot Integration** - Automatically parse and submit donor data from Telegram groups
- **Admin Features** - Edit and delete donor records (admin access controlled via localStorage)

## Telegram Bot Integration

### Setting Up the Telegram Bot

1. **Create a Bot:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command and follow instructions
   - Save the bot token
   - Add the token to `.env.local` as `TELEGRAM_BOT_TOKEN`

2. **Add Bot to Your Group:**
   - Add the bot to your Telegram group
   - Make sure the bot has permission to read messages
   - Get the group chat ID (you can use a bot like @userinfobot or check logs)
   - Optionally add group IDs to `TELEGRAM_ALLOWED_GROUP_IDS` in `.env.local` (comma-separated)

### Testing on Localhost (Development)

For local development, use **polling mode** which doesn't require a public URL:

1. **Start your Next.js dev server** (in one terminal):
   ```bash
   pnpm dev
   ```

2. **Start the Telegram bot in polling mode** (in another terminal):
   ```bash
   pnpm dev:telegram
   ```

3. **Test the bot:**
   - The bot will start and show its username
   - Send a formatted donor message to your Telegram group
   - The bot will automatically parse and submit the data
   - You'll see logs in the terminal showing message processing

**Note:** Polling mode is only for local development. For production, use webhook mode.

### Production Setup (Webhook Mode)

After deploying your application to Vercel or another hosting service:

1. **Configure Webhook:**
   ```bash
   # Option 1: Use the setup API endpoint
   curl -X POST https://yourdomain.com/api/telegram/setup \
     -H "Content-Type: application/json" \
     -d '{"action": "setWebhook", "webhookUrl": "https://yourdomain.com/api/telegram/webhook"}'
   
   # Option 2: Use Telegram Bot API directly
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
   ```

2. **Set environment variables in your hosting platform:**
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_URL` (your deployed URL)
   - `TELEGRAM_ALLOWED_GROUP_IDS` (optional, for security)
   - `NEXT_PUBLIC_API_URL` (your deployed URL)

4. **Message Format:**
   Users can send donor information in the following format:
   ```
   Donor Name: John Doe
   Blood Group: B+
   Batch: 2024
   Hospital: City Hospital
   Phone: 01712345678
   Date: 15-01-2025
   Referrer: Jane Smith
   Hall Name: Main Hall
   ```
   
   Multiple donors can be submitted by separating entries with blank lines.

5. **Bot Features:**
   - Automatically detects donor data in group messages
   - Parses and validates the information
   - Submits to database via API
   - Sends confirmation/error messages back to group
   - Handles duplicates gracefully
   - Supports bulk submissions

6. **Security:**
   - Configure `TELEGRAM_ALLOWED_GROUP_IDS` to restrict bot to specific groups
   - Optionally set `TELEGRAM_WEBHOOK_SECRET` for additional webhook verification
   - Bot only processes messages from allowed groups

## Notes

- The system accepts dates in DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, or M/D/YYYY format
- Phone numbers must be in Bangladesh format (01XXXXXXXXX or +8801XXXXXXXXX)
- Blood groups: A+, A-, B+, B-, AB+, AB-, O+, O- (supports formats like B(+ve), B(positive), etc.)
- Default values for batch and hospital are "Unknown" if not provided

