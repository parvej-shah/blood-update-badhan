import { NextRequest, NextResponse } from 'next/server'
import { getBotInstance, getAllowedGroupIds } from '@/lib/telegram-bot'

// Admin utility to configure Telegram webhook
export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin authentication here
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { action, webhookUrl } = body

    const bot = getBotInstance()

    if (action === 'setWebhook') {
      if (!webhookUrl) {
        return NextResponse.json(
          { error: 'webhookUrl is required' },
          { status: 400 }
        )
      }

      // Set webhook URL
      const result = await bot.setWebHook(webhookUrl)
      
      return NextResponse.json({
        success: true,
        message: 'Webhook set successfully',
        result,
      })
    }

    if (action === 'deleteWebhook') {
      const result = await bot.deleteWebHook()
      
      return NextResponse.json({
        success: true,
        message: 'Webhook deleted successfully',
        result,
      })
    }

    if (action === 'getWebhookInfo') {
      const info = await bot.getWebHookInfo()
      
      return NextResponse.json({
        success: true,
        webhookInfo: info,
      })
    }

    if (action === 'getBotInfo') {
      const botInfo = await bot.getMe()
      const allowedGroups = getAllowedGroupIds()
      
      return NextResponse.json({
        success: true,
        botInfo: {
          id: botInfo.id,
          username: botInfo.username,
          first_name: botInfo.first_name,
          can_join_groups: (botInfo as any).can_join_groups,
          can_read_all_group_messages: (botInfo as any).can_read_all_group_messages,
        },
        allowedGroupIds: allowedGroups,
        webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: setWebhook, deleteWebhook, getWebhookInfo, or getBotInfo' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in Telegram setup:', error)
    return NextResponse.json(
      { error: 'Failed to process request', message: error.message },
      { status: 500 }
    )
  }
}

// GET request to retrieve bot info
export async function GET(request: NextRequest) {
  try {
    const bot = getBotInstance()
    const botInfo = await bot.getMe()
    const webhookInfo = await bot.getWebHookInfo()
    const allowedGroups = getAllowedGroupIds()

    return NextResponse.json({
      botInfo: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
        can_join_groups: (botInfo as any).can_join_groups,
        can_read_all_group_messages: (botInfo as any).can_read_all_group_messages,
      },
      webhookInfo,
      allowedGroupIds: allowedGroups,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    })
  } catch (error: any) {
    console.error('Error getting Telegram info:', error)
    return NextResponse.json(
      { error: 'Failed to get bot info', message: error.message },
      { status: 500 }
    )
  }
}



