/**
 * Telegram Bot Polling Mode for Local Development
 * 
 * This script runs the bot in polling mode, which is suitable for localhost development.
 * For production, use webhook mode instead.
 * 
 * Usage: pnpm dev:telegram
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import TelegramBot from 'node-telegram-bot-api'
import {
  isGroupAllowed,
  detectDonorDataPattern,
  detectPotentiallyDonorRelated,
  processDonorMessage,
  formatResponseMessage,
  getFormatInstructions,
} from './telegram-bot'

function startPollingBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not defined in environment variables')
    console.error('Please add TELEGRAM_BOT_TOKEN to your .env.local file')
    process.exit(1)
  }

  console.log('🤖 Starting Telegram bot in polling mode...')
  
  // Check if webhook is already set (polling and webhook cannot run simultaneously)
  const tempBot = new TelegramBot(token, { polling: false })
  
  tempBot.getWebHookInfo().then((webhookInfo) => {
    if (webhookInfo.url && webhookInfo.url !== '') {
      console.warn('⚠️  WARNING: A webhook is already configured for this bot!')
      console.warn(`   Webhook URL: ${webhookInfo.url}`)
      console.warn('   Polling mode requires the webhook to be deleted first.')
      console.warn('\n   To delete the webhook, run:')
      console.warn(`   curl "https://api.telegram.org/bot${token}/deleteWebhook"`)
      console.warn('\n   Or use webhook mode in production instead of polling mode.')
      console.warn('\n   Exiting...\n')
      process.exit(1)
    } else {
      console.log('✅ No webhook detected - starting polling mode...')
      // Create bot with polling enabled
      const bot = new TelegramBot(token, { polling: true })
      setupBotHandlers(bot, token)
    }
  }).catch((error) => {
    console.warn('⚠️  Could not check webhook status:', error.message)
    console.log('   Attempting to start polling anyway...')
    const bot = new TelegramBot(token, { polling: true })
    setupBotHandlers(bot, token)
  })
  
  return tempBot
}

function setupBotHandlers(bot: TelegramBot, token: string) {

  bot.on('message', async (msg) => {
    try {
      const chatId = msg.chat.id
      const messageText = msg.text || ''
      const messageId = msg.message_id
      const chatType = msg.chat.type

      // Log all messages for debugging
      console.log(`📨 Received message from ${chatType} ${chatId}: ${messageText.substring(0, 50)}...`)

      // Handle private chats - allow processing donor data here too
      if (chatType === 'private') {
        // Check if message contains donor data pattern
        if (detectDonorDataPattern(messageText)) {
          console.log(`✅ Processing donor data from private chat ${chatId}`)
          
          // Process the donor message
          const result = await processDonorMessage(messageText, chatId)
          
          // Send response back
          try {
            const responseText = formatResponseMessage(result.results)
            const escapedResponse = responseText.replace(/_/g, '\\_').replace(/\*/g, '\\*')
            
            await bot.sendMessage(chatId, escapedResponse, {
              reply_to_message_id: messageId,
              parse_mode: 'Markdown',
            })
            
            console.log(`✅ Sent response to private chat ${chatId}`)
          } catch (error: any) {
            console.error('❌ Error sending Telegram response:', error)
          }
        } else {
          // Not donor data, send help message
          console.log(`💬 Sending help message to private chat ${chatId}`)
          try {
            await bot.sendMessage(chatId, getFormatInstructions(), {
              parse_mode: 'Markdown',
            })
          } catch (error) {
            console.error('Error sending help message:', error)
          }
        }
        return
      }

      // Only process group/supergroup messages
      if (chatType !== 'group' && chatType !== 'supergroup') {
        return
      }

      // Check if group is allowed
      if (!isGroupAllowed(chatId)) {
        console.log(`🚫 Message from unauthorized group: ${chatId}`)
        return
      }

      // Check if message contains donor data pattern
      if (!detectDonorDataPattern(messageText)) {
        // Check if it might be donor-related but not properly formatted
        if (detectPotentiallyDonorRelated(messageText)) {
          // Message seems donor-related but not formatted correctly
          console.log(`📝 Detected unformatted donor message from group ${chatId}`)
          try {
            const formatInstructions = getFormatInstructions()
            const responseText = `❌ Please format your message correctly.\n\n${formatInstructions}\n\nPlease send the donor information again using the format above.`
            
            // Escape markdown special characters
            const escapedResponse = responseText.replace(/_/g, '\\_').replace(/\*/g, '\\*')
            
            await bot.sendMessage(chatId, escapedResponse, {
              reply_to_message_id: messageId,
              parse_mode: 'Markdown',
            })
            
            console.log(`✅ Sent format instructions to group ${chatId}`)
          } catch (error: any) {
            console.error('❌ Error sending format instructions:', error)
          }
        }
        // Not a donor data message, ignore
        return
      }

      console.log(`✅ Processing donor data from group ${chatId}`)

      // Process the donor message
      const result = await processDonorMessage(messageText, chatId)

      // Send response back to the group
      try {
        const responseText = formatResponseMessage(result.results)
        
        // Escape markdown special characters
        const escapedResponse = responseText.replace(/_/g, '\\_').replace(/\*/g, '\\*')
        
        await bot.sendMessage(chatId, escapedResponse, {
          reply_to_message_id: messageId,
          parse_mode: 'Markdown',
        })
        
        console.log(`✅ Sent response to group ${chatId}`)
      } catch (error: any) {
        console.error('❌ Error sending Telegram response:', error)
      }
    } catch (error: any) {
      console.error('❌ Error processing message:', error)
    }
  })

  bot.on('polling_error', (error: any) => {
    console.error('❌ Polling error:', error.message || error)
    
    // Check if it's a timeout error
    if (error.code === 'ETIMEDOUT' || error.cause?.code === 'ETIMEDOUT') {
      console.warn('⚠️  Network timeout - this might be due to:')
      console.warn('   1. Network connectivity issues')
      console.warn('   2. Firewall blocking Telegram API')
      console.warn('   3. Webhook already set (polling and webhook cannot run simultaneously)')
      console.warn('   4. Telegram API temporarily unavailable')
      console.warn('\n💡 Tip: If you have a webhook set, delete it first:')
      console.warn('   curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"')
      console.warn('\n   Or use webhook mode in production instead of polling mode.\n')
    }
    
    // Check if webhook is set (common cause of polling errors)
    if (error.response?.statusCode === 409 || error.message?.includes('Conflict')) {
      console.error('❌ Conflict: A webhook is already set for this bot.')
      console.error('   Delete the webhook first to use polling mode:')
      console.error(`   curl "https://api.telegram.org/bot${token}/deleteWebhook"`)
    }
  })

  bot.on('error', (error: any) => {
    console.error('❌ Bot error:', error.message || error)
  })

  // Get bot info (non-blocking - don't exit if this fails)
  bot.getMe().then((botInfo) => {
    console.log('✅ Bot started successfully!')
    console.log(`   Bot username: @${botInfo.username}`)
    console.log(`   Bot name: ${botInfo.first_name}`)
    console.log(`   Bot ID: ${botInfo.id}`)
    console.log('\n📝 Add this bot to your Telegram group to start receiving donor data!')
    console.log('   The bot will automatically process messages with donor information.\n')
  }).catch((error: any) => {
    // Don't exit - bot is already working and processing messages
    // This is just for display purposes
    console.warn('⚠️  Could not fetch bot info (network timeout), but bot is running...')
    console.warn('   The bot will continue to process messages.')
    console.warn('   This is usually a temporary network issue.\n')
  })
}

// Start the bot when script is executed
startPollingBot()

export { startPollingBot }

