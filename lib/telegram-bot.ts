import TelegramBot from 'node-telegram-bot-api'
import { parseBulkFormattedText, ParsedDonorData } from './parser'

// Initialize bot instance (for sending messages)
let botInstance: TelegramBot | null = null

export function getBotInstance(): TelegramBot {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables')
    }
    // Use polling: false for webhook mode
    botInstance = new TelegramBot(token, { polling: false })
  }
  return botInstance
}

export function getAllowedGroupIds(): number[] {
  const groupIdsStr = process.env.TELEGRAM_ALLOWED_GROUP_IDS
  if (!groupIdsStr) {
    return []
  }
  return groupIdsStr
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id))
}

export function isGroupAllowed(chatId: number): boolean {
  const allowedIds = getAllowedGroupIds()
  if (allowedIds.length === 0) {
    // If no restrictions configured, allow all groups
    // WARNING: In production, you should always configure TELEGRAM_ALLOWED_GROUP_IDS
    console.warn('TELEGRAM_ALLOWED_GROUP_IDS not configured - allowing all groups (not recommended for production)')
    return true
  }
  return allowedIds.includes(chatId)
}

export function detectDonorDataPattern(text: string): boolean {
  // Check if message contains the donor data pattern
  return /Donor Name:\s*.+/i.test(text)
}

export async function processDonorMessage(
  messageText: string,
  chatId: number
): Promise<{
  success: boolean
  results: Array<{
    donor: ParsedDonorData
    status: 'success' | 'duplicate' | 'error'
    message: string
  }>
}> {
  const results: Array<{
    donor: ParsedDonorData
    status: 'success' | 'duplicate' | 'error'
    message: string
  }> = []

  try {
    // Parse the message text
    const parsedDonors = parseBulkFormattedText(messageText)

    if (parsedDonors.length === 0) {
      return {
        success: false,
        results: [{
          donor: {} as ParsedDonorData,
          status: 'error',
          message: `❌ No valid donor data found in message.\n\n${getFormatInstructions()}`,
        }],
      }
    }

    // Submit each donor to the API
    for (const donor of parsedDonors) {
      try {
        // Determine API URL for server-side calls
        // In production, use the public URL. In development, use localhost
        let apiUrl = process.env.NEXT_PUBLIC_API_URL
        
        if (!apiUrl) {
          // Default to localhost for development
          apiUrl = 'http://localhost:3000'
          
          // In production (Vercel), use the VERCEL_URL if available
          if (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL) {
            apiUrl = `https://${process.env.VERCEL_URL}`
          }
        }
        
        console.log(`📤 Submitting donor "${donor.name}" to ${apiUrl}/api/donors`)
        console.log(`   Data:`, JSON.stringify(donor, null, 2))
        
        const response = await fetch(`${apiUrl}/api/donors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donor),
        })
        
        if (!response.ok && response.status === 0) {
          throw new Error(`Cannot connect to ${apiUrl}. Make sure Next.js server is running on port 3000.`)
        }

        const data = await response.json()
        console.log(`📥 API Response: ${response.status} -`, data)

        if (response.ok) {
          console.log(`✅ Successfully submitted donor "${donor.name}"`)
          results.push({
            donor,
            status: 'success',
            message: `✅ Donor "${donor.name}" (${donor.bloodGroup}) submitted successfully`,
          })
        } else if (response.status === 409 || data.code === 'DUPLICATE_ENTRY') {
          results.push({
            donor,
            status: 'duplicate',
            message: `⚠️ Donor "${donor.name}" (${donor.bloodGroup}) already exists in database`,
          })
        } else {
          // Extract validation error details
          let errorMessage = data.error || 'Unknown error'
          
          // Provide more helpful error messages
          if (response.status === 400) {
            // Validation error - provide format help
            if (errorMessage.includes('blood group')) {
              errorMessage = `Invalid blood group format. Use: A+, A-, B+, B-, AB+, AB-, O+, O-`
            } else if (errorMessage.includes('phone')) {
              errorMessage = `Invalid phone format. Use: 01XXXXXXXXX or +8801XXXXXXXXX`
            } else if (errorMessage.includes('date')) {
              errorMessage = `Invalid date format. Use: DD-MM-YYYY, DD.MM.YYYY, or M/D/YYYY`
            } else if (errorMessage.includes('Name')) {
              errorMessage = `Name is required and must be at least 2 characters`
            }
          }
          
          results.push({
            donor,
            status: 'error',
            message: `❌ Error submitting "${donor.name || 'Unknown'}": ${errorMessage}`,
          })
        }
      } catch (error: any) {
        console.error(`❌ Network error submitting "${donor.name}":`, error.message)
        results.push({
          donor,
          status: 'error',
          message: `❌ Error submitting "${donor.name}": ${error.message || 'Network error'}`,
        })
      }
    }

    return {
      success: results.some(r => r.status === 'success'),
      results,
    }
  } catch (error: any) {
    return {
      success: false,
      results: [{
        donor: {} as ParsedDonorData,
        status: 'error',
        message: `Failed to parse message: ${error.message || 'Unknown error'}`,
      }],
    }
  }
}

export function formatResponseMessage(
  results: Array<{
    donor: ParsedDonorData
    status: 'success' | 'duplicate' | 'error'
    message: string
  }>
): string {
  if (results.length === 0) {
    return '❌ No donors processed.'
  }

  const successCount = results.filter(r => r.status === 'success').length
  const duplicateCount = results.filter(r => r.status === 'duplicate').length
  const errorCount = results.filter(r => r.status === 'error').length

  // For single success, show simple confirmation
  if (results.length === 1 && successCount === 1) {
    const donor = results[0].donor
    return `✅ ${donor.name} (${donor.bloodGroup}) submitted`
  }

  // For single duplicate, show simple message
  if (results.length === 1 && duplicateCount === 1) {
    const donor = results[0].donor
    return `⚠️ ${donor.name} (${donor.bloodGroup}) already exists`
  }

  // For single error, show error message
  if (results.length === 1 && errorCount === 1) {
    return results[0].message.replace('❌ Error submitting "', '❌ ').replace('": ', ': ')
  }

  // For multiple results, show concise summary
  let response = ''
  
  if (successCount > 0) {
    response += `✅ ${successCount}`
  }
  if (duplicateCount > 0) {
    response += response ? ` | ⚠️ ${duplicateCount}` : `⚠️ ${duplicateCount}`
  }
  if (errorCount > 0) {
    const failedDonors = results
      .filter(r => r.status === 'error')
      .map(r => r.donor.name || 'Unknown')
      .join(', ')
    response += response ? ` | ❌ ${errorCount} (${failedDonors})` : `❌ ${errorCount} (${failedDonors})`
  }

  return response
}

export function getFormatInstructions(): string {
  return `📋 Please use the following format for donor information:

\`\`\`
Donor Name: John Doe
Blood Group: B+ (or B(+ve), B(positive), etc.)
Batch: 2024
Hospital: City Hospital
Phone: 01712345678
Date: 15-01-2025 (or 15.01.2025 or 1/15/2025)
Referrer: Jane Smith
Hall Name: Main Hall
\`\`\`

**Notes:**
• Blood Group: Supports formats like B(+ve), B(positive), B+ve, A POSITIVE
• Date: Supports DD-MM-YYYY, DD.MM.YYYY, M/D/YYYY formats
• Phone: Must be in Bangladesh format (01XXXXXXXXX or +8801XXXXXXXXX)
• You can submit multiple donors by separating entries with blank lines

**Example:**
\`\`\`
Donor Name: Ahmed Rahman
Blood Group: O+
Batch: 2023
Hospital: Dhaka Medical
Phone: 01712345678
Date: 20-01-2025
Referrer: Dr. Khan
Hall Name: Central Hall
\`\`\``
}

