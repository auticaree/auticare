import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { analyzeScreeningResults } from "@/lib/ai-screening";
import { AuditAction } from "@prisma/client";
import { z } from "zod";

const questionnaireSchema = z.object({
  childId: z.string().min(1),
  childAge: z.number().optional(), // Child age at time of questionnaire
  responses: z.array(
    z.object({
      questionId: z.number().min(1).max(25), // 25 questions per Auti-1.md
      questionText: z.string(),
      category: z.string(),
      answer: z.string(), // "Never", "Rarely", "Sometimes", "Frequently", "Always"
      value: z.number().min(0).max(4), // 0-4 scale
    })
  ).length(25), // Exactly 25 questions required
  score: z.number().min(0).max(100), // 0-100 total score
  shareConsent: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: "Only parents can submit questionnaires" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = questionnaireSchema.parse(body);

    // Verify the child belongs to this parent
    const child = await prisma.childProfile.findFirst({
      where: {
        id: validatedData.childId,
        parentId: session.user.id,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 404 }
      );
    }

    // Perform AI-enhanced analysis
    // maxScore is 100 (25 questions × 4 max points each)
    const maxScore = 100;
    const analysis = await analyzeScreeningResults(
      validatedData.responses,
      validatedData.score,
      maxScore
    );

    // Use AI analysis result
    const result = analysis.overallRisk.label;

    // Get professionals to potentially share with
    const sharedWith: string[] = [];
    if (validatedData.shareConsent) {
      const accessList = await prisma.childAccess.findMany({
        where: {
          childId: child.id,
          isActive: true,
        },
        select: { professionalId: true },
      });
      sharedWith.push(...accessList.map((a) => a.professionalId));
    }

    // Create the questionnaire response with extended analysis
    const questionnaireResponse = await prisma.questionnaireResponse.create({
      data: {
        childId: child.id,
        responderId: session.user.id,
        responses: JSON.stringify({
          answers: validatedData.responses,
          childAge: validatedData.childAge,
          respondent: session.user.name || "Parent/Guardian",
          analysis: {
            overallRisk: analysis.overallRisk,
            categoryBreakdown: analysis.categoryBreakdown,
            keyObservations: analysis.keyObservations,
            recommendations: analysis.recommendations,
            aiSummary: analysis.aiSummary,
            disclaimer: analysis.disclaimer,
          },
        }),
        score: validatedData.score,
        result,
        sharedWith,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.RECORD_CREATED,
      targetType: "QuestionnaireResponse",
      targetId: questionnaireResponse.id,
      metadata: {
        childId: child.id,
        childName: child.name,
        score: validatedData.score,
        maxScore,
        riskLevel: analysis.overallRisk.level,
        sharedWithCount: sharedWith.length,
      },
    });

    return NextResponse.json({
      id: questionnaireResponse.id,
      score: validatedData.score,
      maxScore,
      result,
      analysis: {
        riskLevel: analysis.overallRisk.level,
        riskLabel: analysis.overallRisk.label,
        riskDescription: analysis.overallRisk.description,
        categoryBreakdown: analysis.categoryBreakdown,
        keyObservations: analysis.keyObservations,
        recommendations: analysis.recommendations,
        aiSummary: analysis.aiSummary,
        disclaimer: analysis.disclaimer,
      },
    });
  } catch (error) {
    console.error("Questionnaire submission error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");

    let responses;

    if (session.user.role === "PARENT") {
      // Parents can see all questionnaires for their children
      const children = await prisma.childProfile.findMany({
        where: { parentId: session.user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);

      responses = await prisma.questionnaireResponse.findMany({
        where: {
          childId: childId ? { equals: childId } : { in: childIds },
        },
        include: {
          child: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Professionals can only see shared questionnaires
      responses = await prisma.questionnaireResponse.findMany({
        where: {
          sharedWith: { has: session.user.id },
          ...(childId && { childId }),
        },
        include: {
          child: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Get questionnaires error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
