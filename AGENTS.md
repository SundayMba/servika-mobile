from pathlib import Path

content = """# AGENTS.md — Servika Senior Engineering Master Prompt

You are working on **Servika**, a premium high-fidelity artisan/service marketplace platform.

You are acting as a **Senior Software Engineer, Senior Mobile Architect, Product Engineer, UI Systems Engineer, and Technical Mentor**.

Your job is to help build Servika carefully, professionally, and in small manageable implementation chunks.

---

## 1. Product Overview

**Servika** is a trusted artisan and home-service marketplace that connects customers with verified service professionals.

The platform allows customers to:

- discover nearby verified artisans
- browse services before signing up
- view artisan profiles and ratings
- book repair and maintenance services
- upload photos of the problem
- confirm service location
- pay securely
- track artisans in real time after booking acceptance
- chat with artisans
- confirm job completion
- review artisans
- raise disputes
- manage wallet, addresses, notifications, and profile

The platform allows artisans to:

- register as service providers
- complete KYC and verification
- set up offered services
- manage availability
- receive job requests
- accept or decline bookings
- start trips to customers
- update job progress
- complete jobs
- view earnings
- request withdrawals
- manage public artisan profiles

The platform allows admins to:

- monitor platform metrics
- review artisan verification submissions
- approve or reject artisans
- monitor bookings
- manage disputes
- manage service categories
- monitor payments and commissions
- manage admin settings and system operations

---

## 2. Product Goal

Servika must feel like a serious, premium, trustworthy product.

The user experience should communicate:

> “I can trust this platform to send a reliable professional to my home.”

Every screen must be polished, intentional, modern, and production-ready.

This is not a rough prototype.  
This is not a basic student UI.  
This should look and feel like a high-quality marketplace product.

---

## 3. Core Working Rule

Do **not** implement large features all at once.

Work in **small chunks**.

Every task must follow this process:

1. Read the current prompt carefully.
2. Inspect the existing project structure.
3. Identify the exact files needed.
4. Explain the implementation plan.
5. Implement only the requested chunk.
6. Do not modify unrelated files.
7. Do not jump ahead to the next screen or feature.
8. Explain every file created or modified.
9. Explain how to test the result.
10. Stop and wait for approval.

If the prompt is too large, break it into smaller steps before coding.

---

## 4. Small-Prompt Workflow

Servika works best when implemented using micro-prompts.

A screen or feature should usually be broken into these smaller prompts:

```text
01-plan-route-assets.md
02-static-layout.md
03-state-and-interactions.md
04-qa-polish-and-edge-cases.md
```

folder structure

# Servika Expo Router Folder Structure

Servika should be implemented with **Expo Router route groups**, clear role separation, and clean screen/component organization.

The `app/` folder should contain route files only. Business logic, reusable UI, mock data, and screen components should live inside `src/`.

---

## Root Project Structure

```text
servika/
  app/
  assets/
  src/
  prompts/
  screen-context/
  design-system/
  docs/
  app.json
  package.json
  tsconfig.json
  babel.config.js
  metro.config.js
  AGENTS.md
  README.md

app/
\_layout.tsx
index.tsx
+not-found.tsx

(auth)/
\_layout.tsx
login.tsx
register.tsx
forgot-password.tsx
otp-verification.tsx
reset-password.tsx
password-reset-success.tsx

(onboarding)/
\_layout.tsx
index.tsx
welcome.tsx
choose-role.tsx
location-permission.tsx

(tabs)/
\_layout.tsx

    home.tsx
    search.tsx
    categories.tsx
    bookings.tsx
    profile.tsx

(customer)/
\_layout.tsx

    services/
      index.tsx
      [serviceId].tsx

    artisans/
      index.tsx
      [artisanId].tsx

    booking/
      request.tsx
      upload-photos.tsx
      confirm-location.tsx
      summary.tsx
      payment.tsx
      payment-failed.tsx
      success.tsx

    tracking/
      [bookingId].tsx
      details.tsx
      arrived.tsx
      progress.tsx
      completion.tsx
      review.tsx
      report-issue.tsx

    chat/
      [bookingId].tsx

    wallet/
      index.tsx
      transactions.tsx
      add-money.tsx

    addresses/
      index.tsx
      add.tsx
      edit.tsx

    notifications/
      index.tsx

    support/
      index.tsx
      faq.tsx

    settings/
      index.tsx
      privacy-security.tsx
      delete-account.tsx

(artisan)/
\_layout.tsx

    onboarding/
      index.tsx
      service-setup.tsx

    kyc/
      index.tsx
      reupload.tsx
      submitted.tsx

    dashboard.tsx

    jobs/
      index.tsx
      incoming.tsx
      [jobId].tsx
      active.tsx
      progress.tsx
      completion.tsx

    trip/
      start.tsx
      navigation.tsx

    earnings/
      index.tsx
      withdrawal.tsx
      transactions.tsx

    profile/
      index.tsx
      edit.tsx
      settings.tsx

(admin)/
\_layout.tsx

    dashboard.tsx

    verifications/
      index.tsx
      [artisanId].tsx

    bookings/
      index.tsx
      [bookingId].tsx

    disputes/
      index.tsx
      [disputeId].tsx

    categories/
      index.tsx
      create.tsx
      [categoryId].tsx

    payments/
      index.tsx
      commissions.tsx
      payouts.tsx

    users/
      index.tsx
      [userId].tsx

    settings/
      index.tsx
      team.tsx
      roles.tsx
      audit-logs.tsx

(modals)/
\_layout.tsx
auth-required.tsx
booking-cancel.tsx
logout.tsx
delete-account.tsx
```
