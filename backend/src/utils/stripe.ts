import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from .env');
}

// Nous laissons Stripe utiliser sa version par défaut pour éviter les erreurs de compatibilité
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripe;
