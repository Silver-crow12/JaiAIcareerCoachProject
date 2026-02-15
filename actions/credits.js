"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function addCredits(amount) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: { increment: amount },
      },
    });
    revalidatePath("/image-gen");

    return { success: true, newBalance: updatedUser.credits };
  } catch (error) {
    console.error("Payment Error:", error);
    return { success: false, error: "Transaction failed" };
  }
}