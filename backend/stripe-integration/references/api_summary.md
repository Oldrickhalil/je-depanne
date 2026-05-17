# Stripe API Integration Summary (Node.js)

This reference provides core patterns for implementing Stripe Checkout, Subscriptions, and Webhooks.

## 1. Stripe Checkout for Subscriptions

Create a Checkout Session on the server to redirect users to a hosted payment page.

### Key Parameters
- `mode: 'subscription'`: For recurring payments.
- `line_items`: Array of objects with `price` (ID from dashboard) and `quantity`.
- `success_url`: Redirect after success. Use `{CHECKOUT_SESSION_ID}` template variable.
- `cancel_url`: Redirect after cancellation.

### Node.js Example
```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_XXXXX', quantity: 1 }],
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/cancel',
});
// Redirect user to session.url
```

## 2. Webhook Integration

Webhooks synchronize your database with Stripe events.

### Security & Requirements
- **Signature Verification**: Use `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)`.
- **Raw Body**: Ensure the request body is NOT parsed by middleware like `body-parser` before verification.

### Important Events
- `checkout.session.completed`: Provision access after first payment.
- `invoice.paid`: Confirm recurring payment success.
- `customer.subscription.deleted`: Handle cancellation or expiration.
- `invoice.payment_failed`: Notify user of payment issues.

## 3. Customer Portal

Self-service for managing subscriptions (cancel, upgrade, billing info).

```javascript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: 'cus_XXXXX',
  return_url: 'https://example.com/account',
});
// Redirect user to portalSession.url
```

## 4. Best Practices
- **Local Testing**: Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`.
- **Idempotency**: Handlers should be safe to run multiple times for the same event.
- **Async Processing**: Return 200 OK to Stripe immediately; process logic in the background.
