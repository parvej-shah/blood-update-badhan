# Deployment Verification Checklist

## ✅ Step 1: Verify Environment Variables in Vercel

Go to [Vercel Dashboard](https://vercel.com/parvej-shahs-projects/badhan-blood-update/settings/environment-variables) and ensure these are set:

- ✅ `DATABASE_URL` - Your Supabase PostgreSQL connection string (pooled, port 6543)
- ✅ `DIRECT_URL` - Your Supabase PostgreSQL connection string (direct, port 5432)
- ✅ `TELEGRAM_BOT_TOKEN` - Your bot token (e.g., `8567065964:AAFvmWgqFtqx46cY6wWY8wNKHuZwTeDeTvo`)
- ✅ `TELEGRAM_WEBHOOK_URL` - `https://badhan-blood-update.vercel.app/api/telegram/webhook`
- ✅ `TELEGRAM_ALLOWED_GROUP_IDS` - `-1003806980458` (your group ID)
- ⚠️ `NEXT_PUBLIC_API_URL` - `https://badhan-blood-update.vercel.app` (optional)

**Important:** After adding/updating environment variables, Vercel will automatically redeploy.

---

## ✅ Step 2: Verify Webhook Endpoint is Accessible

```bash
curl https://badhan-blood-update.vercel.app/api/telegram/webhook
```

**Expected Response:**
```json
{"message":"Telegram webhook endpoint is active","timestamp":"..."}
```

✅ **Status:** Webhook endpoint is accessible!

---

## ✅ Step 3: Set the Webhook

After environment variables are set, configure the webhook:

```bash
curl -X POST https://badhan-blood-update.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"action": "setWebhook", "webhookUrl": "https://badhan-blood-update.vercel.app/api/telegram/webhook"}'
```

**Expected Response:**
```json
{"success": true, "message": "Webhook set successfully", "result": true}
```

---

## ✅ Step 4: Verify Webhook is Configured

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Expected Response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://badhan-blood-update.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

✅ Check that:
- `url` matches your deployment URL
- `pending_update_count` is 0 (or low)
- No `last_error_message` field

---

## ✅ Step 5: Test with a Real Message

1. **Send a test message in your Telegram group** (`-1003806980458`):
   ```
   Donor Name: Test User
   Blood Group: O+
   Batch: Test 2024
   Hospital: Test Hospital
   Phone: 01712345678
   Date: 23-01-2025
   Referrer: Test Referrer
   Hall Name: Test Hall
   ```

2. **Check if bot responds:**
   - The bot should reply in the group with a summary
   - If no response, check Vercel logs (see Step 6)

---

## ✅ Step 6: Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/parvej-shahs-projects/badhan-blood-update)
2. Click on **"Deployments"** tab
3. Click on the latest deployment
4. Click on **"Functions"** tab
5. Look for `/api/telegram/webhook` function logs

**Look for:**
- ✅ `Processing message from authorized group: -1003806980458`
- ✅ `Submitting donor "..." to https://badhan-blood-update.vercel.app/api/donors`
- ❌ Any error messages

---

## ✅ Step 7: Verify Database Connection

Check if the API can connect to the database:

```bash
curl https://badhan-blood-update.vercel.app/api/donors
```

**Expected:** Should return a list of donors (or empty array `[]`)

If you get an error, check:
- `DATABASE_URL` is set correctly in Vercel
- Database is accessible from Vercel's IP ranges
- Supabase connection pooling is enabled

---

## ✅ Step 8: Check Bot Info Endpoint

```bash
curl https://badhan-blood-update.vercel.app/api/telegram/setup
```

**Expected Response:**
```json
{
  "botInfo": {
    "id": 8567065964,
    "username": "...",
    "first_name": "..."
  },
  "webhookInfo": {
    "url": "https://badhan-blood-update.vercel.app/api/telegram/webhook",
    ...
  },
  "allowedGroupIds": [-1003806980458],
  "webhookUrl": "https://badhan-blood-update.vercel.app/api/telegram/webhook"
}
```

---

## 🔧 Troubleshooting

### Bot not responding to messages?

1. **Check webhook is set:**
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

2. **Check group ID is allowed:**
   - Verify `TELEGRAM_ALLOWED_GROUP_IDS` includes your group ID
   - Check Vercel logs for "Message from unauthorized group"

3. **Check message format:**
   - Message must contain "Donor Name:" pattern
   - Check Vercel logs for "Not a donor data message"

### Webhook errors in Telegram?

1. **Check Vercel function logs** for errors
2. **Verify environment variables** are set correctly
3. **Test webhook endpoint manually:**
   ```bash
   curl -X POST https://badhan-blood-update.vercel.app/api/telegram/webhook \
     -H "Content-Type: application/json" \
     -d '{"update_id": 1, "message": {"message_id": 1, "chat": {"id": -1003806980458, "type": "supergroup"}, "text": "Donor Name: Test"}}'
   ```

### Database connection errors?

1. Check `DATABASE_URL` in Vercel environment variables
2. Verify Supabase allows connections from Vercel
3. Check Supabase dashboard for connection logs

---

## 📊 Quick Status Check

Run this to check everything at once:

```bash
./verify-deployment.sh
```

Or manually:

```bash
# 1. Webhook endpoint
curl https://badhan-blood-update.vercel.app/api/telegram/webhook

# 2. Webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# 3. Bot info
curl https://badhan-blood-update.vercel.app/api/telegram/setup

# 4. Database
curl https://badhan-blood-update.vercel.app/api/donors
```

---

## ✅ Success Criteria

Your deployment is working correctly if:

- ✅ Webhook endpoint returns 200 OK
- ✅ Webhook is configured in Telegram
- ✅ Bot responds to messages in your group
- ✅ Donors are saved to the database
- ✅ No errors in Vercel logs
- ✅ `pending_update_count` stays at 0

---

## 🚀 Next Steps

Once verified:
1. Monitor Vercel logs for any issues
2. Test with multiple donor messages
3. Verify data appears in your database
4. Share the bot with your team!








