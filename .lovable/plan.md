

## Fix: Anthropic 403 "Request not allowed" for claude-haiku-4-5-20251001

### Diagnosis

The model ID `claude-haiku-4-5-20251001` is valid. The API key is set. The 403 "Request not allowed" error means **the current API key does not have permission to access this model**.

This is an Anthropic account/key issue, not a code issue. Common causes:
- The API key was created before Claude 4.5 Haiku was available and needs to be regenerated
- The Anthropic account/plan doesn't include access to this model
- The key has restricted model permissions

### Action needed from you

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys
2. Verify your key has access to `claude-haiku-4-5-20251001` (try it in the Anthropic playground or workbench)
3. If the key doesn't work there either, generate a new API key
4. Once you have a working key, I'll update the secret in Lovable

### What I will do (no code changes needed)

The code at line 768 already uses `"claude-haiku-4-5-20251001"` — that's correct. Once the API key issue is resolved, I'll update the secret using the `update_secret` tool. No code changes required.

