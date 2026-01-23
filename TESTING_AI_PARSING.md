# Testing AI Parsing on Localhost

This guide explains how to test the AI-powered parsing feature on your local development environment.

## Prerequisites

1. Make sure you have API keys configured in `.env.local`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   DEEPSEEK_API_KEY="your_deepseek_api_key"
   USE_AI_PARSING="true"
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

## Testing Methods

### Method 1: Web Interface (DonorPaste Component)

1. Navigate to `http://localhost:3000/submit`
2. In the "Paste Formatted Text" section, paste unstructured text like:
   ```
   Tanvir Ahmed
   Badhon
   B(+ve)
   Chemistry 23-24
   3rd time
   BRB hospital
   +8801518961476
   02.01.2026
   ```
3. Click "Parse & Preview"
4. The system will:
   - First try regex parsing (sync)
   - If that fails, automatically try AI parsing (async)
   - Show the parsed results

### Method 2: Test API Endpoint

You can test the AI parsing directly via the API endpoint:

```bash
curl -X POST http://localhost:3000/api/test/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Tanvir Ahmed\nBadhon\nB(+ve)\nChemistry 23-24\nBRB hospital\n+8801518961476\n02.01.2026"
  }'
```

Or using a tool like Postman or Thunder Client in VS Code.

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "donors": [
    {
      "name": "Badhon",
      "bloodGroup": "B+",
      "batch": "Chemistry 23-24",
      "hospital": "BRB hospital",
      "phone": "01518961476",
      "date": "02-01-2026",
      "referrer": "Tanvir Ahmed",
      "hallName": ""
    }
  ]
}
```

### Method 3: Telegram Bot (Recommended for Real-World Testing)

1. Start the Telegram bot in polling mode (in a separate terminal):
   ```bash
   pnpm dev:telegram
   ```

2. Send unstructured messages to your Telegram group, like:
   ```
   Saifullah
   Arafat
   AB(+)ve
   17-12-25
   01637234096
   ```

3. The bot will:
   - Detect unstructured text
   - Use AI parsing (Gemini → DeepSeek fallback)
   - Submit to the database
   - Reply with a summary

4. Check the terminal logs to see:
   - `🤖 Attempting AI parsing for unstructured text...`
   - `🤖 Attempting to parse with Gemini...` or `🤖 Attempting to parse with DeepSeek...`
   - `✅ AI parsing successful: X donor(s) extracted`

## Test Cases

### Test Case 1: Two Names Format (First = Referrer, Second = Donor)
```
Input:
Tanvir Ahmed
Badhon
B(+ve)
Chemistry 23-24
BRB hospital
+8801518961476
02.01.2026

Expected Output:
- name: "Badhon"
- referrer: "Tanvir Ahmed"
- bloodGroup: "B+"
- batch: "Chemistry 23-24"
- hospital: "BRB hospital"
- phone: "01518961476"
- date: "02-01-2026"
```

### Test Case 2: Single Name Format
```
Input:
Abdur
Sojib
AB+
15-12-25
01777967666

Expected Output:
- name: "Sojib"
- referrer: "Abdur"
- bloodGroup: "AB+"
- phone: "01777967666"
- date: "15-12-2025"
```

### Test Case 3: Missing Fields
```
Input:
Saifullah
bubel
ab+
31-11-25
01742498137

Expected Output:
- name: "bubel"
- referrer: "Saifullah"
- bloodGroup: "AB+"
- phone: "01742498137"
- date: "31-11-2025"
- batch: "Unknown"
- hospital: "Unknown"
```

## Debugging

### Check Console Logs

In your terminal where `pnpm dev` is running, you should see:
- `🤖 Attempting AI parsing for unstructured text...`
- `🤖 Attempting to parse with Gemini...` or `🤖 Attempting to parse with DeepSeek...`
- `✅ AI parsing successful: X donor(s) extracted`
- Or error messages if parsing fails

### Common Issues

1. **"AI parsing is disabled"**
   - Check that `USE_AI_PARSING="true"` in `.env.local`
   - Restart the dev server after changing `.env.local`

2. **"No AI API keys configured"**
   - Make sure at least one of `GEMINI_API_KEY` or `DEEPSEEK_API_KEY` is set
   - Check for typos in the environment variable names

3. **"Gemini/DeepSeek parsing failed"**
   - Check your API key is valid
   - Check your internet connection
   - Check API rate limits/quota

4. **Parsing returns empty results**
   - Check the text format matches the expected patterns
   - Verify the AI is correctly identifying the two-name format
   - Check console logs for detailed error messages

## Notes

- AI parsing is only used when regex parsing fails or unstructured text is detected
- The system tries Gemini first, then DeepSeek as fallback
- AI parsing has a 30-second timeout
- The web interface (DonorPaste) will automatically fall back to AI parsing if sync parsing fails

