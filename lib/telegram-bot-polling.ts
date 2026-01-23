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
  const bot = new TelegramBot(token, { polling: true })

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

  bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error)
  })

  bot.on('error', (error) => {
    console.error('❌ Bot error:', error)
  })

  // Get bot info
  bot.getMe().then((botInfo) => {
    console.log('✅ Bot started successfully!')
    console.log(`   Bot username: @${botInfo.username}`)
    console.log(`   Bot name: ${botInfo.first_name}`)
    console.log(`   Bot ID: ${botInfo.id}`)
    console.log('\n📝 Add this bot to your Telegram group to start receiving donor data!')
    console.log('   The bot will automatically process messages with donor information.\n')
  }).catch((error) => {
    console.error('❌ Failed to get bot info:', error)
    console.error('   Please check your TELEGRAM_BOT_TOKEN is correct')
    process.exit(1)
  })

  return bot
}

// Start the bot when script is executed
startPollingBot()

export { startPollingBot }

