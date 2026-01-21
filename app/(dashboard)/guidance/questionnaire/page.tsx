import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuestionnaireClient from "./questionnaire-client";

export default async function QuestionnairePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Only parents can access the questionnaire
    if (session.user.role !== "PARENT") {
        redirect("/dashboard");
    }

    // Get children for the questionnaire
    const children = await prisma.childProfile.findMany({
        where: { parentId: session.user.id },
        select: { id: true, name: true },
    });

    if (children.length === 0) {
        redirect("/children/add");
    }

    return <QuestionnaireClient children={children} />;
}
