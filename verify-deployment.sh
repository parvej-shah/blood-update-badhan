#!/bin/bash

# Verification script for deployed Telegram bot
# Usage: ./verify-deployment.sh

DEPLOYED_URL="https://badhan-blood-update.vercel.app"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8567065964:AAFvmWgqFtqx46cY6wWY8wNKHuZwTeDeTvo}"

echo "🔍 Verifying deployed Telegram bot..."
echo "=========================================="
echo ""

# 1. Check if webhook endpoint is accessible
echo "1️⃣  Testing webhook endpoint (GET)..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOYED_URL}/api/telegram/webhook")
if [ "$WEBHOOK_STATUS" = "200" ]; then
    echo "   ✅ Webhook endpoint is accessible (HTTP $WEBHOOK_STATUS)"
else
    echo "   ❌ Webhook endpoint returned HTTP $WEBHOOK_STATUS"
fi
echo ""

# 2. Check setup endpoint
echo "2️⃣  Testing setup endpoint (GET)..."
SETUP_RESPONSE=$(curl -s "${DEPLOYED_URL}/api/telegram/setup")
if echo "$SETUP_RESPONSE" | grep -q "botInfo\|error"; then
    echo "   ✅ Setup endpoint is responding"
    echo "   Response: $(echo $SETUP_RESPONSE | head -c 200)..."
else
    echo "   ⚠️  Setup endpoint response unclear"
fi
echo ""

# 3. Check webhook info from Telegram
echo "3️⃣  Checking webhook status from Telegram API..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
if echo "$WEBHOOK_INFO" | grep -q "url"; then
    WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$WEBHOOK_URL" ]; then
        echo "   ✅ Webhook is configured"
        echo "   URL: $WEBHOOK_URL"
        if [[ "$WEBHOOK_URL" == *"badhan-blood-update"* ]]; then
            echo "   ✅ Webhook URL matches deployment"
        else
            echo "   ⚠️  Webhook URL doesn't match deployment URL"
        fi
    else
        echo "   ⚠️  Webhook URL not found in response"
    fi
else
    echo "   ❌ Could not get webhook info"
fi
echo ""

# 4. Check pending updates
echo "4️⃣  Checking for pending updates..."
PENDING_UPDATES=$(echo "$WEBHOOK_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
if [ -n "$PENDING_UPDATES" ] && [ "$PENDING_UPDATES" != "0" ]; then
    echo "   ⚠️  There are $PENDING_UPDATES pending updates"
    echo "   This might indicate the webhook is not processing messages"
else
    echo "   ✅ No pending updates (webhook is processing correctly)"
fi
echo ""

# 5. Check last error
echo "5️⃣  Checking for webhook errors..."
LAST_ERROR=$(echo "$WEBHOOK_INFO" | grep -o '"last_error_message":"[^"]*"' | cut -d'"' -f4)
if [ -n "$LAST_ERROR" ]; then
    echo "   ⚠️  Last error: $LAST_ERROR"
else
    echo "   ✅ No recent errors"
fi
echo ""

echo "=========================================="
echo "📋 Next steps:"
echo "   1. Send a test message in your Telegram group"
echo "   2. Check Vercel logs: https://vercel.com/parvej-shahs-projects/badhan-blood-update"
echo "   3. Verify the bot responds in the group"
echo ""







