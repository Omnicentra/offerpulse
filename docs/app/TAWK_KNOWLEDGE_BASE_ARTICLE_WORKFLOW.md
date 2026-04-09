# tawk.to Knowledge Base Article Workflow

Use this runbook to add and publish a new OfferPulse knowledge base article in tawk.to.

## Prerequisites

- You can sign in to `https://dashboard.tawk.to`.
- You have access to the correct Knowledge Base property.
- You already have article content prepared:
  - Title
  - Subtitle
  - Body
  - Slug
  - Meta description

## Create and Publish an Article

1. Open the article creation page:
   - `https://dashboard.tawk.to/#/knowledgebase/<knowledge_base_id>/articles/new`
2. Fill article content fields:
   - `Title`
   - `Subtitle`
   - `Article body`
3. Open the `Document` tab.
4. Fill metadata fields:
   - `Slug` (for example: `first-30-minutes-with-offerpulse`)
   - `Meta Description`
5. Set `Author` to **Chisom Oguibe (You)**.
   - Do this every time, even if it appears preselected.
6. Confirm `Visibility` is correct (usually `Public`).
7. Click `Publish`.
8. Verify status changed from `Draft` to `Published`.

## Post-Publish Verification

1. Go to Articles list:
   - `https://dashboard.tawk.to/#/knowledgebase/<knowledge_base_id>/articles`
2. Search by title.
3. Confirm the article appears with expected title and published status.

## Edit an Existing Article (fix missing body, metadata, etc.)

1. Open Articles list (same URL as above).
2. Search by exact title or slug keyword.
3. **Click the article title** in the table to open the editor (not every control is reachable via accessibility automation, so manual click is the reliable path).
4. Switch to the `Block` tab and paste or type the **Article body**.
5. Open `Document` and confirm **Slug**, **Meta description**, and **Author** (`Chisom Oguibe (You)`).
6. Click `Publish` (or save draft first if you prefer).

Canonical source copy for all article bodies and metadata lives in `misc/articles.json` in this repo.

### Paste-ready bodies (three articles that shipped without body text)

Use these verbatim in the **Block** editor (markdown-style headings are fine for tawk).

**Slug: `manage-workspace-members-and-roles`**

```text
Invite teammates from workspace settings and assign appropriate roles.

### Role guidance
- **Owner/Admin:** billing, integrations, governance
- **Member:** daily monitoring and execution

### Best practices
- Keep billing/integration permissions limited
- Use shared alert channels for continuity
- Remove stale members to reduce noise and risk
```

**Slug: `update-profile-avatar-password`**

```text
From account settings, you can update display name, avatar URL, and password (if your account uses password login).

### Security recommendation
Use a unique password and rotate credentials periodically, especially for owner/admin accounts.
```

**Slug: `reset-your-password`**

```text
Use the forgot-password flow from sign-in.

### Steps
1. Request reset link with your account email
2. Open reset email
3. Set a new password
4. Re-login

If you originally signed up with Google, use Google sign-in unless you have explicitly set a password.
```

## Recommended Content Pattern

For consistency across OfferPulse docs:

- Keep title concise and task-oriented.
- Use subtitle to explain outcome/value.
- Use numbered steps in the body for onboarding/how-to content.
- Use kebab-case slug.
- Keep meta description short and specific (one sentence).

## Common UI Issues and Fixes

- **Stale element / click intercepted**
  - Refresh page snapshot/state and retry action.
  - Re-open dropdowns before selecting options.
- **Unexpected popup blocks controls**
  - Press `Escape` to close overlays, then continue.
- **Wrong field targeted**
  - Always switch to `Document` before setting slug/meta/author.

## Quick Checklist (Copy/Paste)

- [ ] Title entered
- [ ] Subtitle entered
- [ ] Body entered
- [ ] Document tab opened
- [ ] Slug set
- [ ] Meta description set
- [ ] Author set to `Chisom Oguibe (You)`
- [ ] Visibility checked
- [ ] Published
- [ ] Verified in article list
