# Telegram Bot Localhost Testing Guide

## Quick Start

### 1. Prerequisites
- Telegram bot token from [@BotFather](https://t.me/botfather)
- Bot added to your `.env.local` file:
  ```env
  TELEGRAM_BOT_TOKEN="your_bot_token_here"
  ```

### 2. Start the Application

**Terminal 1 - Start Next.js server:**
```bash
pnpm dev
```

**Terminal 2 - Start Telegram bot (polling mode):**
```bash
pnpm dev:telegram
```

You should see:
```
🤖 Starting Telegram bot in polling mode...
✅ Bot started successfully!
   Bot username: @your_bot_name
   Bot name: Your Bot Name
   Bot ID: 123456789

📝 Add this bot to your Telegram group to start receiving donor data!
   The bot will automatically process messages with donor information.
```

### 3. Test the Bot

1. **Add the bot to your Telegram group**
2. **Send a formatted donor message:**
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

3. **The bot will:**
   - Parse the message
   - Submit to your local API (`http://localhost:3000/api/donors`)
   - Reply with a summary in the group

### 4. Check Logs

In Terminal 2 (bot), you'll see:
```
📨 Received message from supergroup -123456789: Donor Name: John Doe...
✅ Processing donor data from group -123456789
✅ Sent response to group -123456789
```

In Terminal 1 (Next.js), you'll see API requests:
```
POST /api/donors 201
```

## Troubleshooting

### Bot not responding?
- Check that `TELEGRAM_BOT_TOKEN` is set in `.env.local`
- Verify the bot is added to your group
- Check terminal logs for errors

### API connection errors?
- Make sure Next.js dev server is running on port 3000
- Check that `NEXT_PUBLIC_API_URL` is not set (it should default to localhost)

### Bot not processing messages?
- Verify the message contains "Donor Name:" pattern
- Check group ID is in `TELEGRAM_ALLOWED_GROUP_IDS` (if configured)
- Look for error messages in the bot terminal

## Testing Multiple Donors

Send multiple donors separated by blank lines:
```
Donor Name: John Doe
Blood Group: B+
Batch: 2024
Hospital: City Hospital
Phone: 01712345678
Date: 15-01-2025
Referrer: Jane Smith
Hall Name: Main Hall

Donor Name: Jane Smith
Blood Group: O+
Batch: 2023
Hospital: Medical Center
Phone: 01876543210
Date: 16-01-2025
Referrer: Dr. Khan
Hall Name: Central Hall
```

The bot will process all donors and send a summary.

## Production Deployment

For production, use webhook mode instead of polling:
1. Deploy to Vercel
2. Set webhook URL using `/api/telegram/setup` endpoint
3. The bot will automatically use webhook mode



