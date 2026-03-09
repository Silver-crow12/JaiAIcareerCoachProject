"use server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(creditAmount, priceInCents) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("You must be logged in to purchase credits.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd", // You can change this to "usd" if you prefer
            product_data: {
              name: `${creditAmount} AI Credits`,
              description: "Top up your Sensai AI generation credits.",
            },
            // Stripe expects the price in the smallest currency unit (e.g., paise or cents)
            unit_amount: priceInCents, 
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Where to send the user after payment
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      // CRUCIAL: We pass the Clerk User ID so the webhook knows who to give credits to!
      client_reference_id: userId, 
      metadata: {
        creditsToGive: creditAmount,
      }
    });

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Error:", error);
    throw new Error("Failed to create checkout session.");
  }
}