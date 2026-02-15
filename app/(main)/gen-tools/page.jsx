import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import GenAISelector from "./_components/gen-ai-selector";

export default async function ImageGenPage() {
  const { userId } = await auth();

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  const currentCredits = user?.credits || 0;

  return (
    <div>      
      <GenAISelector userCredits={currentCredits} />
    </div>
  );
}