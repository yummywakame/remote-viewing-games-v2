# Voice Integration Setup Instructions

## Current Issues
The current Web Speech API implementation has reliability issues across browsers and devices. To improve this, we'll switch to:
- ResponsiveVoice.js for text-to-speech (speaking)
- Picovoice for speech recognition (listening)

## Setup Steps

### 1. ResponsiveVoice.js Setup
1. Go to https://responsivevoice.org/register
2. Sign up for a free developer account
3. Get your API key from the dashboard
4. For non-commercial use, you can use their free tier

### 2. Picovoice Setup
1. Go to https://console.picovoice.ai/
2. Create a free account
3. After logging in:
   - Go to "Access Management" in the console
   - Create a new access key
   - Copy the access key
4. Install their SDK:
   ```bash
   npm install @picovoice/picovoice-react @picovoice/web-voice-processor
   ```

### Next Steps
Once you have both API keys:
1. Store them securely (do not commit them to version control)
2. Return to this project and request help with the code refactoring
3. The refactoring will include:
   - Replacing Web Speech API speech synthesis with ResponsiveVoice
   - Replacing Web Speech API recognition with Picovoice
   - Updating the game flow
   - Adding proper error handling and fallbacks

### Notes
- ResponsiveVoice has a free tier for non-commercial use
- Picovoice offers 200 daily API calls in their free tier
- Both services work reliably across desktop and mobile browsers
- These services will provide more natural and reliable voice interaction

### Pricing (as of 2024)
- ResponsiveVoice: Free for non-commercial use
- Picovoice: Free tier includes 200 daily API calls

When you're ready to proceed with the implementation, ensure you have:
1. ResponsiveVoice API key
2. Picovoice access key
3. Picovoice SDK installed

Keep these instructions for reference when returning to implement the voice features.
