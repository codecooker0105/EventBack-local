import Stripe from 'stripe';

import config from '../config';
import logger from './logger/stripe';


class StripeEngine {
  constructor() {
    this.stripe = new Stripe(config.stripe_key);
  }

  // PaymentIntent
  async createPaymentIntent(amount, currency, customer_id) {
    const paymentIntent  = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customer_id,
    });
    return paymentIntent;
  }

  async createCharge(amount, currency, token) {
    console.log("TOKEN", token)
    const charge = await this.stripe.charges.create({
      amount: amount,
      currency: currency,
      source: token,
      description: 'Charge',
    });
    return charge;
  }

  // PaymentMethod
  async getPaymentMethod(payment_id) {
    let paymentMethod;
    try {
      paymentMethod = await this.stripe.paymentMethods.retrieve(payment_id)
    } catch (err) {
      logger.error(`error on getting stripe payment method:`, err)
    }
    return paymentMethod;
  }

  async attachPaymentMethod(payment_id, customer_id) {
    let paymentMethod;
    try {
      paymentMethod = await this.stripe.paymentMethods.attach(payment_id, {customer: customer_id})
    } catch (err) {
      logger.error(`error on attach stripe payment method to customer:`, err)
    }
    return paymentMethod;
  }

  // Token
  async getToken(token_id) {
    let token;
    try {
      token = await this.stripe.tokens.retrieve(token_id)
    } catch (err) {
      logger.error(`error on getting stripe token:`, err)
    }
    return token;
  }

  // Customer
  async createCustomer(name, email) {
    let customer;
    try {
      customer = await this.stripe.customers.create({
        name,
        email,
      });
    } catch (err) {
      logger.error(`error on creating stripe customer:`, err)
    }
    return customer;
  }

  async createCustomerWithPaymentMethod(payment_id, name, email) {
    let customer;
    try {
      customer = await this.stripe.customers.create({
        payment_method: payment_id,
        name,
        email,
        invoice_settings: {
          default_payment_method: payment_id,
        },
      });
    } catch (err) {
      logger.error(`error on creating stripe customer:`, err)
    }
    return customer;
  }

  async createCustomerWithToken(token_id, name, email) {
    let customer;
    try {
      customer = await this.stripe.customers.create({
        name,
        email,
        source: token_id,
      });
    } catch (err) {
      logger.error(`error on creating stripe customer:`, err)
    }
    return customer;
  }

  async getCustomer(customer_id) {
    let customer;
    try {
      customer = await this.stripe.customers.retrieve(customer_id)
    } catch (err) {
      logger.error(`error on getting stripe customer:`, err)
    }
    return customer;
  }

  async getCustomerDefaultSource(customer) {
    let source;
    try {
      if (customer && customer.default_source) {
        source = await this.stripe.customers.retrieveSource(customer.id, customer.default_source)
      }
    } catch (err) {
      logger.error(`error on getting stripe customer default source:`, err)
    }
    return source;
  }

  async updateCustomer(customer_id, params) {
    let customer = false;
    try {
      customer = await this.stripe.customers.update(customer_id, params)
    } catch (err) {
      logger.error(`error on updating stripe customer:`, err)
    }
    return customer;
  }
}

const stripeEngine = new StripeEngine();
export default stripeEngine
