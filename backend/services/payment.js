// backend/services/payment.js
// Integração com Stripe para pagamentos

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const PaymentService = {
  // Criar customer no Stripe
  async createCustomer(email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        description: `THE BOX User - ${email}`
      });
      return customer;
    } catch (error) {
      console.error('Erro ao criar customer Stripe:', error);
      throw error;
    }
  },
  
  // Criar checkout session (para o usuário pagar)
  async createCheckoutSession(customerId, priceId) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId, // PRO_MONTHLY_PRICE_ID ou PRO_ANNUAL_PRICE_ID
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`
      });
      return session;
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      throw error;
    }
  },
  
  // Cancelar subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: true }
      );
      return subscription;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      throw error;
    }
  },
  
  // Verificar status da subscription
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Erro ao buscar subscription:', error);
      throw error;
    }
  },
  
  // Webhook handler
  async handleWebhook(event) {
    switch(event.type) {
      case 'customer.subscription.created':
        console.log('✅ Subscription criada:', event.data.object);
        return { processed: true };
      
      case 'customer.subscription.updated':
        console.log('✅ Subscription atualizada:', event.data.object);
        return { processed: true };
      
      case 'customer.subscription.deleted':
        console.log('❌ Subscription cancelada:', event.data.object);
        return { processed: true };
      
      case 'invoice.payment_succeeded':
        console.log('💰 Pagamento recebido:', event.data.object);
        return { processed: true };
      
      case 'invoice.payment_failed':
        console.log('⚠️ Pagamento falhou:', event.data.object);
        return { processed: true };
      
      default:
        return { processed: false };
    }
  }
};

export default PaymentService;
