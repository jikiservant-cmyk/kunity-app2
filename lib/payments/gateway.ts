import { PaymentProvider } from "./types";
import { LivePayProvider } from "./live-pay-provider";

// Abstract factory to return the configured payment provider
const createProvider = (): PaymentProvider => {
  const providerType = process.env.PAYMENT_PROVIDER_TYPE || "livepay";
  
  if (providerType === "livepay") {
    return new LivePayProvider();
  }
  
  // Example for future providers (like Stripe, MPESA, etc.)
  // if (providerType === "stripe") {
  //   return new StripeProvider();
  // }
  
  throw new Error(`Unsupported payment provider: ${providerType}`);
};

export const paymentGateway = createProvider();
