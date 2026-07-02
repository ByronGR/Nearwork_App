# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into the Nearwork client portal (`app.nearwork.co`). The integration replaces the existing inline JS snippet with a proper npm-based setup using `posthog-js` and `posthog-node`. PostHog is now initialized via `instrumentation-client.ts` (Next.js 15.3+ standard), routed through a reverse proxy in `next.config.ts`, and wired to 14 business events covering authentication, candidate review, pipeline navigation, kickoff brief approvals, user invites, and profile updates. Users are identified on sign-in and after each page load via Firebase `onAuthStateChanged`, linking all events to a known person profile in PostHog.

| Event name | Description | File |
|---|---|---|
| `user_signed_in` | A client or partner user successfully logs into the portal. | `src/components/client-portal.tsx` |
| `account_created` | A new portal account is created via an invite link. | `src/components/client-portal.tsx` |
| `password_reset_requested` | A user requests a password reset email from the login screen. | `src/components/client-portal.tsx` |
| `user_signed_out` | A user logs out of the client portal. | `src/components/client-portal.tsx` |
| `candidate_viewed` | A portal user opens a candidate's full profile. | `src/components/client-portal.tsx` |
| `candidate_note_added` | A portal user adds a note to a candidate's profile. | `src/components/client-portal.tsx` |
| `candidate_favorited` | A portal user stars a candidate to mark them as a favorite. | `src/components/client-portal.tsx` |
| `candidate_interview_flagged` | A portal user flags a candidate for an interview request. | `src/components/client-portal.tsx` |
| `pipeline_opened` | A portal user navigates into a specific hiring pipeline. | `src/components/client-portal.tsx` |
| `user_invite_sent` | A portal admin invites a new user to join their organization's workspace. | `src/components/client-portal.tsx` |
| `profile_updated` | A portal user saves changes to their profile (name or role). | `src/components/client-portal.tsx` |
| `kickoff_brief_approved` | A client approves the kickoff brief for an opening. | `src/components/kickoff-brief.tsx` |
| `kickoff_brief_changes_requested` | A client requests changes to a submitted kickoff brief. | `src/components/kickoff-brief.tsx` |
| `invite_sent` | Server-side event confirming the invite email was dispatched via the API route. | `src/app/api/send-invite/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/485159/dashboard/1762629)
- [Portal Logins](https://us.posthog.com/project/485159/insights/thPOYI3D) — Daily sign-in volume over 30 days
- [Candidate Engagement Funnel](https://us.posthog.com/project/485159/insights/6H7Ww85e) — Login → pipeline → candidate viewed → brief approved
- [Candidate Actions Trend](https://us.posthog.com/project/485159/insights/HQQkCl7l) — Daily views, favorites, interview flags, and notes
- [Kickoff Brief Activity](https://us.posthog.com/project/485159/insights/bfBxWyFN) — Weekly approvals vs. change requests
- [New Accounts & Invites](https://us.posthog.com/project/485159/insights/9TiOof3c) — Weekly account creations and invites sent

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` (or any onboarding/bootstrap scripts) so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or the Sentry/PostHog bundler plugin) into CI so production stack traces de-minify in PostHog Error Tracking.
- [ ] Confirm the returning-visitor path also calls `identify` — the current implementation identifies on `onAuthStateChanged` which fires on every load, so returning sessions should be covered; verify this in the PostHog Person activity tab after a real test login.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-pages-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
