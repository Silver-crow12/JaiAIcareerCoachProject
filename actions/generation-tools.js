
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function generateContent(prompt, selectedType) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const creditCost = selectedType === "IMAGE" ? 1 : 5;

  if (user.credits < creditCost) {
    return { 
      success: false, 
      error: "Insufficient credits", 
      limitReached: true,
      required: creditCost,
      balance: user.credits
    };
  }

  let resultData = "";

  try {
    if (selectedType === "IMAGE") {
      try {
        resultData = await generateImage(
          prompt,
          "stabilityai/stable-diffusion-xl-base-1.0",
        );
      } catch (primaryError) {
        console.warn(
          "Primary model failed, trying backup...",
          primaryError.message,
        );
        resultData = await generateImage(
          prompt,
          "runwayml/stable-diffusion-v1-5",
        );
      }
    } else if (selectedType === "VIDEO") {
      resultData =
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
    }
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditCost } },
    });

    return {
      success: true,
      data: resultData,
      type: selectedType,
      remainingCredits: updatedUser.credits,
    };
  } catch (error) {
    console.error(" Final Gen Error:", error);
    return {
      success: false,
      error: error.message || "Generation failed. Please try again later.",
    };
  }
}

async function generateImage(prompt, modelRef) {
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${modelRef}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json",
        "x-use-cache": "false",
      },
      method: "POST",
      body: JSON.stringify({ inputs: prompt }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`HF Error (${modelRef}):`, response.status, errorText);
    throw new Error(`API Error: ${response.status}`);
  }

  const blob = await response.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
