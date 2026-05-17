---
name: stripe-integration
description: Specialized knowledge for integrating Stripe payments, subscriptions, and webhooks in Node.js applications. Use when the user needs to implement or debug Stripe-related functionality.
---

# Stripe Integration

This skill provides procedural guidance and reference patterns for integrating Stripe into Node.js applications.

## Core Workflows

- **Checkout Sessions**: Creating secure, hosted payment pages for one-time payments or subscriptions.
- **Webhook Management**: Handling asynchronous events from Stripe (e.g., payment success, cancellation) with signature verification.
- **Customer Portal**: Implementing self-service subscription management for users.

## Reference Documentation

For detailed API patterns and best practices, see [api_summary.md](references/api_summary.md).

## Quick Start (Node.js)

1. **Initialize Stripe**:
   ```javascript
   const stripe = require('stripe')('sk_test_XXXXX');
   ```

2. **Create Subscription Session**:
   ```javascript
   const session = await stripe.checkout.sessions.create({
     mode: 'subscription',
     line_items: [{ price: 'price_XXXXX', quantity: 1 }],
     success_url: 'https://example.com/success',
     cancel_url: 'https://example.com/cancel',
   });
   ```

3. **Verify Webhook Signature**:
   ```javascript
   const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
   ```

## Local Development

Always use the Stripe CLI for testing webhooks locally:
`stripe listen --forward-to localhost:3000/api/webhook`
