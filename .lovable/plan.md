

## Plan: Fix Anthropic API key + model ID + logging

### Problem

Two issues found:

1. **Model ID is wrong** — Line 768 currently uses `"claude-sonnet-4-6-20250217"` (from a previous failed attempt). It needs to be reverted to `"claude-haiku-4-5-20251001"` as you specified.

2. **API key mismatch** — The `ANTHROPIC_API_KEY` secret deployed to Lovable/Cloudflare may differ from your working local key. However, I cannot read `.dev.vars` — it's not in the repo (gitignored). You'll need to provide the key value so I can update the secret via the `update_secret` tool.

3. **Poor error logging** — `console.error` may not surface in Cloudflare logs. Needs improvement.

### Changes

**File: `src/utils/analyze.functions.ts` (lines 768, 774-783)**

1. Revert model to `"claude-haiku-4-5-20251001"`
2. Improve error logging in the `synthesize()` catch/error paths:
   - Use `console.log` with `[SYNTHESIS ERROR]` prefix
   - Log the full status code and response body on failure

```ts
// Line 768: fix model
model: "claude-haiku-4-5-20251001",

// Lines 774-783: better logging
if (!res.ok) {
  const errorBody = await res.text();
  console.log(`[SYNTHESIS ERROR] Anthropic HTTP ${res.status}: ${errorBody}`);
  return "Synthèse indisponible.";
}
// ...
} catch (e) {
  console.log("[SYNTHESIS ERROR] Anthropic call failed:", e instanceof Error ? e.message : e);
  return "Synthèse indisponible.";
}
```

**Secret update**: After you paste the working API key value from `.dev.vars`, I'll use `update_secret` to set it. The deployment happens automatically.

### What I need from you

Paste the `ANTHROPIC_API_KEY` value from your `.dev.vars` file so I can update the deployed secret. I cannot access that file — it's not in the repository.

