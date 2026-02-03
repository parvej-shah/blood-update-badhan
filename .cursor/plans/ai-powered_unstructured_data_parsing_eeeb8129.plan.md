---
name: AI-Powered Unstructured Data Parsing
overview: Integrate Google Gemini and DeepSeek AI APIs to parse unstructured donor information when the regex-based parser fails. The system will detect unstructured text and use AI as a fallback to extract donor data.
todos:
  - id: install-ai-deps
    content: Install @google/generative-ai package for Gemini API integration
    status: completed
  - id: create-ai-parser
    content: Create lib/ai-parser.ts with Gemini and DeepSeek parsing functions
    status: completed
  - id: create-detector
    content: Add isUnstructuredText() function to detect when AI parsing is needed
    status: completed
  - id: update-parser
    content: Update parseFormattedText and parseBulkFormattedText to use AI fallback
    status: completed
  - id: update-telegram-bot
    content: Update processDonorMessage to integrate AI parsing
    status: completed
  - id: add-env-vars
    content: Add AI API key environment variables and configuration
    status: completed
  - id: error-handling
    content: Implement comprehensive error handling for AI API calls
    status: completed
  - id: test-ai-parsing
    content: Test AI parsing with various unstructured text formats
    status: completed
---

#AI-Powered Unstructured Data Parsing Integration

## Overview

Add AI-powered parsing using Google Gemini and DeepSeek APIs to handle unstructured donor data when the regex-based parser fails. The system will intelligently detect unstructured text and use AI to extract donor information.

## Architecture Flow

```mermaid
flowchart TD
    Message[Telegram Message] --> Detect{Detect Structure}
    Detect -->|Structured| Regex[Regex Parser]
    Detect -->|Unstructured| AI[AI Parser]
    Regex -->|Success| Validate[Validate Data]
    Regex -->|Fails| AI
    AI -->|Try Gemini| Gemini[Gemini API]
    Gemini -->|Success| Validate
    Gemini -->|Fails| DeepSeek[DeepSeek API]
    DeepSeek -->|Success| Validate
    DeepSeek -->|Fails| Error[Return Error]
    Validate --> Submit[Submit to API]
```



## Implementation Steps

### 1. Install Dependencies

- Add `@google/generative-ai` for Gemini API
- Add `axios` or use native `fetch` for DeepSeek API
- No additional dependencies needed for DeepSeek (uses standard HTTP)

### 2. Create AI Parser Service

**File: `lib/ai-parser.ts`**

- Create `parseWithGemini(text: string)` function
- Create `parseWithDeepSeek(text: string)` function
- Create `parseWithAI(text: string)` with fallback chain (Gemini → DeepSeek)
- Use structured prompts to extract donor data in JSON format
- Handle API errors gracefully

### 3. Create Unstructured Text Detector

**File: `lib/parser.ts` (update existing)**

- Add `isUnstructuredText(text: string)` function
- Detection logic:
- Check if text contains "Donor Name:" pattern (structured)
- Check if text mentions donor-related keywords but lacks structure
- Check if regex parser returns empty/invalid results
- Return boolean indicating if AI parsing should be attempted

### 4. Update Parser to Use AI Fallback

**File: `lib/parser.ts`**

- Modify `parseFormattedText` to accept optional `useAI` parameter
- Modify `parseBulkFormattedText` to:

1. Try regex parsing first
2. If fails or detects unstructured text, try AI parsing
3. Return parsed results from either method

- Maintain backward compatibility with existing structured format

### 5. Update Telegram Bot Processing

**File: `lib/telegram-bot.ts`**

- Update `processDonorMessage` to use AI parser as fallback
- Log when AI parsing is used (for monitoring)
- Handle AI parsing errors gracefully

### 6. Environment Variables

Add to `.env.local`:

- `GEMINI_API_KEY`: Google Gemini API key (optional, for free tier)
- `DEEPSEEK_API_KEY`: DeepSeek API key (optional, for free tier)
- `USE_AI_PARSING`: Enable/disable AI parsing (default: true)

### 7. AI Prompt Engineering

Create structured prompts that:

- Extract all donor fields (name, blood group, batch, hospital, phone, date, referrer, hall name)
- Handle various text formats (paragraphs, lists, mixed formats)
- Return JSON in expected format
- Handle missing fields gracefully
- Support multiple donors in one message

### 8. Error Handling

- Rate limiting: Handle API rate limits gracefully
- Timeout: Set reasonable timeouts for AI API calls
- Fallback: If both AI services fail, return helpful error message
- Logging: Log AI parsing attempts and results

### 9. Cost Optimization

- Only use AI when regex parsing fails
- Cache successful AI parsing patterns (optional)
- Use free tier limits efficiently

## Key Features

- **Smart Detection**: Automatically detects unstructured text
- **Dual AI Support**: Gemini and DeepSeek with automatic fallback
- **Backward Compatible**: Existing structured format still works
- **Error Resilient**: Graceful fallback if AI services fail
- **Cost Efficient**: Only uses AI when needed

## Files to Create/Modify

- `lib/ai-parser.ts` - AI parsing service (new)
- `lib/parser.ts` - Update with unstructured detection and AI fallback
- `lib/telegram-bot.ts` - Update to use AI parser
- `.env.local` - Add AI API keys (documentation only, not in code)

## AI Prompt Structure

```javascript
Extract donor information from the following text and return as JSON:
{
  "name": "string",
  "bloodGroup": "string (A+, A-, B+, B-, AB+, AB-, O+, O-)",
  "batch": "string or 'Unknown'",
  "hospital": "string or 'Unknown'",
  "phone": "string (Bangladesh format: 01XXXXXXXXX)",
  "date": "string (DD-MM-YYYY format)",
  "referrer": "string or empty",
  "hallName": "string or empty"
}

Text: [user message]
```



## Testing

- Test with various unstructured formats