"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIInsights(industry) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const cleanedText = response.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
}

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsights: true },
  });

  if (!user) throw new Error("User not found");

  if (user.industryInsights) {
    return user.industryInsights;
  }

  const insights = await generateAIInsights(user.industry);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      industryInsights: {
        create: {
          industry: user.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { industryInsights: true },
  });

  return updatedUser.industryInsights;
}
