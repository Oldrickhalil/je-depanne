"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CardForm from "./CardForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "pk_test_placeholder");

export default function StripePayment({ amount, userId, onSuccess }: { amount: number, userId: string, onSuccess: () => void }) {
  return (
    <Elements stripe={stripePromise}>
      <CardForm amount={amount} userId={userId} onSuccess={onSuccess} />
    </Elements>
  );
}
