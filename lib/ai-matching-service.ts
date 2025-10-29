import Anthropic from "@anthropic-ai/sdk";

export interface DonationData {
  id: string;
  title: string;
  description: string;
  donation_type: string;
  items: any[];
  condition: string;
  available_quantity: number;
  city: string;
  province: string;
  delivery_available: boolean;
  delivery_radius_km?: number;
  total_estimated_value?: number;
  urgency_level?: string;
}

export interface ApplicationData {
  id: string;
  application_title: string;
  application_type: string;
  priority_level: string;
  resources_needed: any[];
  current_situation: string;
  expected_impact: string;
  beneficiaries_count?: number;
  needed_by_date?: string;
  school: {
    id: string;
    school_name: string;
    province: string;
    district: string;
    total_students: number;
    total_teachers: number;
    students_requiring_meals?: number;
    has_electricity: boolean;
    has_running_water: boolean;
    has_library: boolean;
    classroom_condition?: string;
  };
}

export interface MatchRecommendation {
  application_id: string;
  school_id: string;
  school_name: string;
  match_score: number;
  match_justification: string;
  priority_rank: number;
}

export async function generateDonationMatches(
  donation: DonationData,
  applications: ApplicationData[]
): Promise<MatchRecommendation[]> {
  const apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY or NEXT_PUBLIC_CLAUDE_API_KEY environment variable is not set");
  }

  const client = new Anthropic({
    apiKey,
  });

  const prompt = `You are an AI assistant helping to match donations with schools in need. Analyze the following donation and resource applications, then provide a prioritized list of the best matches.

DONATION DETAILS:
${JSON.stringify(donation, null, 2)}

SCHOOL APPLICATIONS (${applications.length} applications):
${JSON.stringify(applications, null, 2)}

MATCHING CRITERIA:
1. Resource Type Match: How well does the donation type align with the application needs?
2. Quantity & Capacity: Does the quantity match the school's size and stated needs?
3. Geographic Proximity: Schools in the same province/city should be prioritized, especially if delivery is limited
4. Urgency & Priority: Consider both the donation urgency and application priority level
5. Impact Potential: Number of beneficiaries, school conditions, and expected impact
6. Condition Appropriateness: Is the donation condition suitable for the stated needs?

RESPONSE FORMAT:
Provide your response as a JSON array of match recommendations. Each recommendation must include:
- application_id: The application ID
- school_id: The school ID
- school_name: The school name
- match_score: A score from 0-100 indicating match quality
- match_justification: A clear, concise explanation (2-4 sentences) of why this is a good match, covering key criteria
- priority_rank: The priority ranking (1 = highest priority)

Sort the recommendations by priority_rank (best matches first).

Return ONLY the JSON array, no additional text or explanation.`;

  try {
    console.log("[AI Matching] Starting AI matching request...");
    console.log(`[AI Matching] Donation: ${donation.title}`);
    console.log(`[AI Matching] Applications to match: ${applications.length}`);

    const message = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("[AI Matching] Received response from Claude API");
    console.log(`[AI Matching] Response ID: ${message.id}`);
    console.log(`[AI Matching] Model: ${message.model}`);

    const content = message.content[0];
    if (content.type !== "text") {
      console.error("[AI Matching] ERROR: Unexpected response type:", content.type);
      throw new Error("Unexpected response type from Claude API");
    }

    console.log("[AI Matching] Response text length:", content.text.length);
    console.log("[AI Matching] First 200 chars:", content.text.substring(0, 200));

    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[AI Matching] ERROR: Could not find JSON in response");
      console.error("[AI Matching] Full response:", content.text);
      throw new Error("Could not extract JSON from Claude API response");
    }

    console.log("[AI Matching] Successfully extracted JSON from response");
    const matches: MatchRecommendation[] = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (!Array.isArray(matches)) {
      throw new Error("Invalid response format: expected an array");
    }

    for (const match of matches) {
      if (
        !match.application_id ||
        !match.school_id ||
        !match.school_name ||
        typeof match.match_score !== "number" ||
        !match.match_justification ||
        typeof match.priority_rank !== "number"
      ) {
        throw new Error("Invalid match recommendation structure");
      }
    }

    console.log(`[AI Matching] Successfully validated ${matches.length} matches`);
    return matches;
  } catch (error) {
    console.error("[AI Matching] ERROR generating donation matches:", error);
    if (error instanceof Error) {
      console.error("[AI Matching] Error name:", error.name);
      console.error("[AI Matching] Error message:", error.message);
      console.error("[AI Matching] Error stack:", error.stack);
    }
    throw error;
  }
}
