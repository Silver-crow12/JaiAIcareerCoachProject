import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text(); 
  
  const reqHeaders = await headers();
  const signature = reqHeaders.get("stripe-signature");

  let event;

  try {

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("⚠️ Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.client_reference_id;
    const creditsToAdd = Number(session.metadata?.creditsToGive || 0);

    if (userId && creditsToAdd > 0) {
      try {
        await prisma.user.update({
          where: { clerkUserId: userId },
          data: { credits: { increment: creditsToAdd } },
        });
        
        console.log(`SUCCESS! Added ${creditsToAdd} credits to user ${userId}`);
      } catch (dbError) {
        console.error("Database Error updating credits:", dbError);
        return new NextResponse("Database Error", { status: 500 });
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}