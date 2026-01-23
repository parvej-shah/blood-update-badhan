import { NextRequest, NextResponse } from 'next/server'
import {
  getBotInstance,
  isGroupAllowed,
  detectDonorDataPattern,
  detectPotentiallyDonorRelated,
  processDonorMessage,
  formatResponseMessage,
  getFormatInstructions,
} from '@/lib/telegram-bot'

// Telegram Update type
interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: 'private' | 'group' | 'supergroup' | 'channel'
      title?: string
    }
    date: number
    text?: string
  }
}

// Verify request comes from Telegram (optional but recommended)
// Telegram IP ranges: https://core.telegram.org/bots/webhooks#validating-webhook-requests
function verifyTelegramRequest(request: NextRequest): boolean {
  // In production, you should verify the request comes from Telegram IP ranges
  // For now, we rely on webhook secret token
  // You can implement IP verification here if needed
  
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (webhookSecret) {
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
    return secretHeader === webhookSecret
  }
  
  // If no secret configured, allow (not recommended for production)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (!verifyTelegramRequest(request)) {
      console.warn('Unauthorized webhook request - invalid secret token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const update: TelegramUpdate = await request.json()

    // Only process messages (ignore other update types)
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message
    const chatId = message.chat.id
    const messageText = message.text
    const messageId = message.message_id

    // Ensure messageText is defined (should be guaranteed by check above, but TypeScript needs this)
    if (!messageText) {
      return NextResponse.json({ ok: true })
    }

    // Only process group messages
    if (message.chat.type === 'private') {
      // Send help message for private chats
      try {
        const bot = getBotInstance()
        await bot.sendMessage(chatId, getFormatInstructions())
      } catch (error) {
        console.error('Error sending help message:', error)
      }
      return NextResponse.json({ ok: true })
    }

    // Check if group is allowed (security: restrict to specific groups)
    if (!isGroupAllowed(chatId)) {
      console.warn(`Message from unauthorized group: ${chatId} (type: ${message.chat.type})`)
      // Silently ignore - don't reveal which groups are allowed
      return NextResponse.json({ ok: true })
    }
    
    // Log authorized message processing
    console.log(`Processing message from authorized group: ${chatId} (message ID: ${messageId})`)

    // Check if message contains donor data pattern
    if (!detectDonorDataPattern(messageText)) {
      // Check if it might be donor-related but not properly formatted
      if (detectPotentiallyDonorRelated(messageText)) {
        // Message seems donor-related but not formatted correctly
        try {
          const bot = getBotInstance()
          const formatInstructions = getFormatInstructions()
          const responseText = `❌ Please format your message correctly.\n\n${formatInstructions}\n\nPlease send the donor information again using the format above.`
          
          // Escape markdown special characters
          const escapedResponse = responseText.replace(/_/g, '\\_').replace(/\*/g, '\\*')
          
          await bot.sendMessage(chatId, escapedResponse, {
            reply_to_message_id: messageId,
            parse_mode: 'Markdown',
          })
          
          console.log(`📝 Sent format instructions to group ${chatId} for unformatted message`)
        } catch (error: any) {
          console.error('Error sending format instructions:', error)
        }
      }
      // Not a donor data message, ignore
      return NextResponse.json({ ok: true })
    }

    // Process the donor message
    const result = await processDonorMessage(messageText, chatId)

    // Send response back to the group
    try {
      const bot = getBotInstance()
      const responseText = formatResponseMessage(result.results)
      
      // Reply to the original message
      // Escape markdown special characters to prevent parsing errors
      const escapedResponse = responseText.replace(/_/g, '\\_').replace(/\*/g, '\\*')
      
      await bot.sendMessage(chatId, escapedResponse, {
        reply_to_message_id: messageId,
        parse_mode: 'Markdown',
      })
    } catch (error: any) {
      console.error('Error sending Telegram response:', error)
      // Log but don't fail the webhook
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error processing Telegram webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// Handle GET request for webhook verification (Telegram sends this initially)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Telegram webhook endpoint is active',
    timestamp: new Date().toISOString(),
  })
}

