# GitHub Education Offers For This Project

This guide shows how student-focused developer offers can support AI Arranger Studio. Availability, credits, and eligibility can change, so verify each offer on the official page before relying on it for a deployment or class project. Checked on May 18, 2026.

## GitHub Copilot

Official reference: [GitHub Copilot student setup](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students)

How to use it here:

- Ask for tests around music-theory utilities and FastAPI validation.
- Generate small refactor ideas, then review them manually.
- Draft prompts and response schemas for the backend AI service.
- Use it as a learning tool, not as an unreviewed code generator.

## GitHub Codespaces

Official reference: [GitHub Codespaces](https://github.com/features/codespaces)

How to use it here:

- Create a cloud dev environment with Node, Python, and recommended extensions.
- Let contributors run the frontend and backend without installing local tooling.
- Later add `.devcontainer/devcontainer.json` once the local stack stabilizes.

## GitHub Actions

Official reference: [GitHub Actions documentation](https://docs.github.com/en/actions)

How to use it here:

- Run `npm ci`, format checks, lint, tests, and build for the frontend.
- Run Ruff, Pytest, and compile checks for the backend.
- Later add deployment jobs after the hosting target is selected.

## Azure Credits

Official reference: [Azure for Students](https://azure.microsoft.com/en-us/free/students)

How to use it here:

- Host the FastAPI backend on Azure App Service or Azure Container Apps.
- Try Azure Static Web Apps for the frontend.
- Later test Azure OpenAI or managed databases, keeping all provider keys in backend environment variables.

## MongoDB Atlas

Official reference: [MongoDB Student Pack](https://www.mongodb.com/students)

How to use it here:

- Store `MusicProject` documents when cloud project persistence is added.
- Keep the current JSON project shape as the first document schema.
- Add indexes on user id and `updatedAt` once authentication exists.

## Sentry

Official reference: [Sentry for Education](https://sentry.io/for/education/)

How to use it here:

- Replace the current monitoring placeholders with Sentry browser and Python SDKs.
- Capture frontend AI fallback failures and backend provider exceptions.
- Add release names tied to GitHub Actions build SHA values.

## New Relic

Official reference: [New Relic for Students](https://docs.newrelic.com/docs/accounts/accounts-billing/account-setup/student-program/)

How to use it here:

- Monitor FastAPI latency, error rate, and endpoint throughput.
- Add browser monitoring when the app is publicly hosted.
- Track how often AI requests fall back to mocks.

## BrowserStack

Official reference: [BrowserStack and GitHub Student Developer Pack](https://www.browserstack.com/blog/browserstack-for-github-students/)

How to use it here:

- Test the piano roll and transport controls in multiple browsers.
- Verify mobile layouts on real devices.
- Later add automated cross-browser smoke tests for the deployed app.

## Cloudflare

Official reference: [Cloudflare for Students](https://www.cloudflare.com/students/)

How to use it here:

- Deploy the frontend on Cloudflare Pages.
- Try Workers for a lightweight edge proxy or feature-flag endpoint.
- Use Cloudflare DNS and caching when the app gets a custom domain.

## LocalStack

Official reference: [LocalStack for Students](https://www.localstack.cloud/localstack-for-students)

How to use it here:

- Practice cloud workflows locally before touching paid infrastructure.
- Emulate S3-style object storage for future MIDI exports and audio renders.
- Add CI checks for cloud-adjacent code once storage queues or background jobs exist.
