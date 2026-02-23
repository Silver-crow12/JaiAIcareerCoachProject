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
      balance: user.credits,
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
      const { fal } = require("@fal-ai/client");

      if (!process.env.FAL_KEY) {
        throw new Error("Missing FAL_KEY in environment variables.");
      }

      console.log("🎬 Starting video generation via Fal.ai...");

      try {
        const result = await fal.subscribe(
          "fal-ai/kling-video/v1.6/standard/text-to-video",
          {
            input: {
              prompt: prompt,
              aspect_ratio: "16:9",
            },
            logs: true,
            onQueueUpdate: (update) => {
              if (update.status === "IN_PROGRESS") {
                console.log("⏳ Fal is generating your video...");
              }
            },
          },
        );

        resultData = result.data.video.url;
      } catch (error) {
        console.error("Fal Video Error:", error);
        throw new Error("Video generation failed via Fal.ai");
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Deduct Credits
      const u = await tx.user.update({
        where: { id: user.id },
        data: { credits: { decrement: creditCost } },
      });

      // 2. Save to History Table
      await tx.generatedContent.create({
        data: {
          userId: user.id,
          content: resultData,
          type: selectedType,
          prompt: prompt,
        },
      });

      return u;
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

//Function to fetch user history
export async function getGenHistory() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return [];

  const history = await prisma.generatedContent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20, // Fetch last 20 items
  });

  return history;
}

// Helper Function (Kept exactly the same)
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
