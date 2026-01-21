/**
 * AI Screening helper for AutiCare
 * Provides risk band analysis and AI-generated summaries for questionnaire results
 * Based on: ASD Screening Questionnaire (Parents) - Technical Report V1.0
 * 
 * IMPORTANT DISCLAIMER: This questionnaire is a screening tool and does NOT replace 
 * medical, psychological, or diagnostic evaluation. The result only indicates the 
 * presence of behavioral signs that may be associated with ASD.
 * 
 * Response Scale: Never (0), Rarely (1), Sometimes (2), Frequently (3), Always (4)
 * Total Score Range: 0-100 points (25 questions × 4 max points each)
 */

export interface QuestionResponse {
    questionId: number;
    questionText: string;
    category: string;
    answer: string;
    value: number; // 0-4 scale
}

export interface RiskBand {
    level: "low" | "moderate" | "high";
    score: number;
    maxScore: number;
    percentage: number;
    label: string;
    color: string;
    description: string;
}

export interface CategoryAnalysis {
    category: string;
    score: number;
    maxScore: number;
    percentage: number;
    riskLevel: "low" | "moderate" | "high";
    concerns: string[];
}

export interface ScreeningAnalysis {
    overallRisk: RiskBand;
    categoryBreakdown: CategoryAnalysis[];
    keyObservations: string[];
    recommendations: string[];
    aiSummary: string | null;
    disclaimer: string;
}

// Risk band thresholds based on Auti-1.md specification
// Score Range: 0-29 = Low, 30-59 = Moderate, 60-100 = High
const RISK_THRESHOLDS = {
    low: 30,      // 0-29 points
    moderate: 60, // 30-59 points
};

// Category weights for analysis (all questions contribute to concern)
const CATEGORY_WEIGHTS: Record<string, number> = {
    "Communication and Language": 1.2,     // Section 1
    "Social Interaction": 1.2,             // Section 2
    "Repetitive Behaviors and Restricted Interests": 1.0, // Section 3
    "Sensory Sensitivities": 0.9,          // Section 4
    "Development and General Behavior": 1.0, // Section 5
};

/**
 * Calculate risk band based on score (0-100 scale)
 * Per Auti-1.md: Low (0-29), Moderate (30-59), High (60-100)
 */
export function calculateRiskBand(score: number, maxScore: number = 100): RiskBand {
    const percentage = (score / maxScore) * 100;

    if (score < RISK_THRESHOLDS.low) {
        return {
            level: "low",
            score,
            maxScore,
            percentage,
            label: "Low Risk",
            color: "primary",
            description:
                "Few behavioral signs observed. Continue to monitor your child's development and maintain regular check-ups with your pediatrician. This result suggests typical development patterns in the areas assessed.",
        };
    } else if (score < RISK_THRESHOLDS.moderate) {
        return {
            level: "moderate",
            score,
            maxScore,
            percentage,
            label: "Moderate Risk",
            color: "amber",
            description:
                "Some behavioral signs present. We recommend follow-up with your pediatrician or a developmental specialist to discuss these observations. Early monitoring and support can be beneficial.",
        };
    } else {
        return {
            level: "high",
            score,
            maxScore,
            percentage,
            label: "High Risk",
            color: "coral",
            description:
                "Multiple behavioral signs present. We strongly recommend professional evaluation by a developmental specialist or child psychologist. Early intervention services often lead to better outcomes.",
        };
    }
}

/**
 * Analyze responses by category
 * Each section has 5 questions with max 4 points each = 20 points per category
 */
export function analyzeByCategory(responses: QuestionResponse[]): CategoryAnalysis[] {
    const categories = new Map<string, { responses: QuestionResponse[]; maxScore: number }>();

    // Group responses by category
    responses.forEach((r) => {
        if (!categories.has(r.category)) {
            categories.set(r.category, { responses: [], maxScore: 0 });
        }
        const cat = categories.get(r.category)!;
        cat.responses.push(r);
        cat.maxScore += 4; // Max score per question is 4
    });

    // Analyze each category
    const analysis: CategoryAnalysis[] = [];
    categories.forEach((data, category) => {
        let score = 0;
        const concerns: string[] = [];

        data.responses.forEach((r) => {
            // Direct scoring: higher values = more concern
            score += r.value;

            // Flag responses with value >= 3 (Frequently or Always)
            if (r.value >= 3) {
                concerns.push(r.questionText);
            }
        });

        const percentage = (score / data.maxScore) * 100;
        let riskLevel: "low" | "moderate" | "high" = "low";

        // Category-level thresholds (proportional to overall)
        const categoryLowThreshold = (RISK_THRESHOLDS.low / 100) * data.maxScore;
        const categoryModThreshold = (RISK_THRESHOLDS.moderate / 100) * data.maxScore;

        if (score >= categoryModThreshold) riskLevel = "high";
        else if (score >= categoryLowThreshold) riskLevel = "moderate";

        analysis.push({
            category,
            score,
            maxScore: data.maxScore,
            percentage,
            riskLevel,
            concerns,
        });
    });

    return analysis;
}

/**
 * Generate key observations based on responses
 */
export function generateObservations(
    responses: QuestionResponse[],
    categoryAnalysis: CategoryAnalysis[]
): string[] {
    const observations: string[] = [];

    // Find highest concern categories
    const sortedCategories = [...categoryAnalysis].sort(
        (a, b) => b.percentage - a.percentage
    );

    // Primary concern area
    if (sortedCategories[0]?.riskLevel !== "low") {
        observations.push(
            `${sortedCategories[0].category} shows the most areas of potential concern.`
        );
    }

    // Communication and Language specific
    const commLang = categoryAnalysis.find((c) => c.category === "Communication and Language");
    if (commLang && commLang.riskLevel !== "low") {
        if (commLang.concerns.some(c => c.includes("eye contact"))) {
            observations.push("Eye contact patterns may benefit from professional observation.");
        }
        if (commLang.concerns.some(c => c.includes("echolalia") || c.includes("repeats"))) {
            observations.push("Speech patterns including repetition were noted.");
        }
    }

    // Social Interaction specific
    const social = categoryAnalysis.find((c) => c.category === "Social Interaction");
    if (social && social.riskLevel !== "low") {
        observations.push(
            "Social interaction patterns may warrant discussion with a developmental specialist."
        );
    }

    // Repetitive Behaviors specific
    const repetitive = categoryAnalysis.find((c) => c.category === "Repetitive Behaviors and Restricted Interests");
    if (repetitive && repetitive.riskLevel !== "low") {
        if (repetitive.concerns.some(c => c.includes("routines"))) {
            observations.push("Strong reactions to routine changes were noted.");
        }
        if (repetitive.concerns.some(c => c.includes("movements") || c.includes("flapping"))) {
            observations.push("Repetitive movements or motor behaviors were observed.");
        }
    }

    // Sensory specific
    const sensory = categoryAnalysis.find((c) => c.category === "Sensory Sensitivities");
    if (sensory && sensory.riskLevel !== "low") {
        observations.push(
            "Sensory sensitivities may benefit from occupational therapy evaluation."
        );
    }

    // Development specific
    const development = categoryAnalysis.find((c) => c.category === "Development and General Behavior");
    if (development && development.riskLevel !== "low") {
        if (development.concerns.some(c => c.includes("regression"))) {
            observations.push("IMPORTANT: Developmental regression was noted - this should be discussed with a professional promptly.");
        }
    }

    // Add strengths if applicable
    const lowConcernCategories = categoryAnalysis.filter(
        (c) => c.riskLevel === "low"
    );
    if (lowConcernCategories.length > 0 && lowConcernCategories.length < categoryAnalysis.length) {
        observations.push(
            `Strengths observed in: ${lowConcernCategories.map((c) => c.category).join(", ")}.`
        );
    }

    return observations;
}

/**
 * Generate recommendations based on risk level
 */
export function generateRecommendations(
    overallRisk: RiskBand,
    categoryAnalysis: CategoryAnalysis[]
): string[] {
    const recommendations: string[] = [];

    if (overallRisk.level === "low") {
        recommendations.push(
            "Continue regular developmental check-ups with your pediatrician."
        );
        recommendations.push(
            "Monitor your child's development and note any changes over time."
        );
        recommendations.push(
            "Engage in interactive play and activities that support social and language development."
        );
        recommendations.push(
            "This screening can be repeated periodically to track development."
        );
    } else if (overallRisk.level === "moderate") {
        recommendations.push(
            "Schedule a follow-up discussion with your pediatrician about these results."
        );
        recommendations.push(
            "Consider requesting a developmental screening or evaluation by a specialist."
        );
        recommendations.push(
            "Keep a journal of behaviors, milestones, and any concerns to share with professionals."
        );
        recommendations.push(
            "Explore early intervention resources in your area - early support is beneficial."
        );
        recommendations.push(
            "Share this screening report with your healthcare provider."
        );
    } else {
        recommendations.push(
            "Schedule an appointment with a developmental pediatrician or child psychologist."
        );
        recommendations.push(
            "Contact your local early intervention services for a comprehensive evaluation."
        );
        recommendations.push(
            "Share these screening results with the evaluating professional."
        );
        recommendations.push(
            "Remember: This screening does not diagnose - only qualified professionals can make a diagnosis."
        );
        recommendations.push(
            "Early intervention services are most effective when started early."
        );
    }

    // Category-specific recommendations
    const highConcernCategories = categoryAnalysis.filter(
        (c) => c.riskLevel === "high"
    );

    if (highConcernCategories.some((c) => c.category === "Communication and Language")) {
        recommendations.push(
            "A speech-language pathologist evaluation may be beneficial for communication assessment."
        );
    }

    if (highConcernCategories.some((c) => c.category === "Sensory Sensitivities")) {
        recommendations.push(
            "An occupational therapy evaluation could help address sensory processing needs."
        );
    }

    if (highConcernCategories.some((c) => c.category === "Social Interaction")) {
        recommendations.push(
            "Social skills groups or therapy may be helpful once evaluated by a professional."
        );
    }

    return recommendations;
}

/**
 * Generate AI summary (stub for now - can integrate with LLM provider)
 * Returns null if AI is not configured
 */
export async function generateAISummary(
    responses: QuestionResponse[],
    analysis: ScreeningAnalysis
): Promise<string | null> {
    // Check if AI is configured
    const aiApiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

    if (!aiApiKey) {
        // Return a structured summary without AI
        return null;
    }

    try {
        // Placeholder for actual AI integration
        // In production, this would call an LLM API

        const categoryHighlights = analysis.categoryBreakdown
            .filter((c) => c.riskLevel !== "low")
            .map((c) => `${c.category}: ${c.riskLevel} concern`)
            .join("; ");

        const summary = `
Based on the 25-question ASD screening questionnaire, this child shows ${analysis.overallRisk.label.toLowerCase()} 
(score: ${analysis.overallRisk.score}/${analysis.overallRisk.maxScore}). 
${categoryHighlights ? `Areas to monitor include: ${categoryHighlights}.` : "All categories assessed showed low concern."} 
${analysis.keyObservations[0] || ""} 
Remember: This is a screening tool only and does not provide a diagnosis. Please consult with qualified healthcare professionals for proper evaluation and guidance.
    `.trim().replace(/\s+/g, " ");

        return summary;
    } catch (error) {
        console.error("AI summary generation failed:", error);
        return null;
    }
}

/**
 * Main analysis function - combines all analysis steps
 * maxScore is 100 (25 questions × 4 max points each)
 */
export async function analyzeScreeningResults(
    responses: QuestionResponse[],
    totalScore: number,
    maxScore: number = 100
): Promise<ScreeningAnalysis> {
    // Calculate overall risk
    const overallRisk = calculateRiskBand(totalScore, maxScore);

    // Analyze by category
    const categoryBreakdown = analyzeByCategory(responses);

    // Generate observations
    const keyObservations = generateObservations(responses, categoryBreakdown);

    // Generate recommendations
    const recommendations = generateRecommendations(overallRisk, categoryBreakdown);

    // Create base analysis
    const analysis: ScreeningAnalysis = {
        overallRisk,
        categoryBreakdown,
        keyObservations,
        recommendations,
        aiSummary: null,
        disclaimer:
            "IMPORTANT DISCLAIMER: This questionnaire is a screening tool only and does NOT provide a diagnosis. " +
            "The result only indicates the presence of behavioral signs that may be associated with Autism Spectrum Disorder (ASD). " +
            "This screening does not replace medical, psychological, or diagnostic evaluation. " +
            "Only licensed healthcare professionals can diagnose autism spectrum disorder or any developmental condition. " +
            "Conceptual basis aligned with DSM-5 and recognized screening instruments.",
    };

    // Try to generate AI summary
    analysis.aiSummary = await generateAISummary(responses, analysis);

    return analysis;
}
