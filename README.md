# NULLXES Cloud

A dark-mode Next.js frontend for a GPU / CPU cloud platform focused on AI, robotics, and high-performance compute workloads.

## Current implementation

The project currently includes:
- Next.js App Router frontend
- React 19 + TypeScript
- Tailwind CSS v4 styling
- shadcn/ui Base UI component foundation
- Premium dark infrastructure marketing layout
- GPU / CPU / cluster / dedicated catalog UI
- Product pages for pricing, storage, networking, instances, and documentation
- A configuration flow that prepares an email quote request
- Neon PostgreSQL, Managed Auth, and a Neon Function

## Routes

- `/` — Compute catalog and product landing page
- `/pricing` — pricing categories and billing units; contact for pricing
- `/storage` — block volumes, object storage, and shared storage
- `/network` — private connectivity, public traffic, and high-speed fabric
- `/instances` — instance workspace with search, filters, and an empty state
- `/docs` — public product and platform documentation
- `/auth/sign-in` and `/auth/sign-up` — account access and registration
- `/auth/forgot-password`, `/auth/reset-password`, and `/auth/verify-email` — Neon Auth recovery and verification flows

## Verified stack

- Next.js: 16.4.0
- React: 19.3.0
- Tailwind CSS: 4.3.3
- TypeScript: 7.0.2
- package manager: npm (package-lock.json present)

## Install and run

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Verification scripts

```bash
npx tsc --noEmit
npm run build
# Start the production app in one terminal.
npm run start
# Run the integration checks in a second terminal.
npm run test:neon
```

`npm run test:neon` checks a live PostgreSQL query, the application health endpoint, the Neon Auth session endpoint, and the deployed Neon Function. It requires the app to be running at `http://127.0.0.1:3000` and the Neon variables in the ignored `.env` file.

### Local Neon environment

Use the local `.env` file for Neon-managed values (`neon env pull`) and `NEON_AUTH_COOKIE_SECRET` (`openssl rand -base64 32`). Keep `.env` private and never commit it. The smoke test deliberately does not create a production auth user; verify successful sign-in with a dedicated test account through `/auth/sign-up`.

## Neon integration

- `/api/health` checks PostgreSQL and the deployed `hello` Function without exposing service errors or credentials.
- `/api/auth/[...path]` proxies Neon Managed Auth. Sign-in, sign-up, password recovery, and email verification use the existing managed auth provider; `/instances` requires an authenticated session.
- Database access uses the pooled `DATABASE_URL`; no schema or migrations are created by this integration.
- Neon Object Storage is provisioned but is not connected to the app yet. No AWS SDK, AWS account, storage API, or storage credentials are used by application code.
- The Neon AI Gateway remains disabled because it is not included in the current plan.

Provider provisioning, billing, and account-specific instance data are not implemented by this integration.

### Neon Auth configuration

The linked `production` branch uses the `neondb` database and Neon Managed Auth. Email/password sign-up requires email verification using a one-time code; Neon Auth is configured to send a verification email at sign-up and sign the user in after successful verification. Password recovery uses Neon Auth's provider-owned reset token and reset API; links expire after 15 minutes.

The email provider is Neon shared SMTP (`auth@mail.myneon.app`). This provider is rate-limited and email delivery has not been verified end to end. Configure a custom SMTP provider for production delivery requirements. Add the final public application origin to the Neon Auth trusted domains for this branch before using registration, verification, or password reset from that domain. The application constructs reset redirects from the current application origin and does not accept arbitrary redirect URLs.

Provider references: [Email verification](https://neon.com/docs/auth/guides/email-verification), [Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp), [Password reset](https://neon.com/docs/auth/guides/password-reset), and [trusted domains](https://neon.com/docs/auth/guides/configure-domains).
