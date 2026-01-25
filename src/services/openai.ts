import type { Recipe, NutritionalAssessment } from '../types/recipe';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const SYSTEM_PROMPT = `You are a professional nutritionist and dietitian. Analyze recipes and provide accurate nutritional information per serving.
Always respond with valid JSON in the exact format specified. Be precise with your estimates based on standard nutritional databases.
Consider cooking methods and their effects on nutrition.`;

const JSON_FORMAT_INSTRUCTIONS = `Please provide your analysis in the following JSON format:
{
  "perServing": {
    "calories": <number in kcal>,
    "protein": <number in grams>,
    "carbohydrates": <number in grams>,
    "fat": <number in grams>,
    "fiber": <number in grams>,
    "sugar": <number in grams>,
    "sodium": <number in mg>
  },
  "healthScore": <number 1-10, where 10 is healthiest>,
  "healthNotes": [<array of brief observations about the nutritional profile>],
  "warnings": [<array of any health concerns or high values to be aware of>],
  "benefits": [<array of health benefits of this recipe>]
}`;

const IMAGE_JSON_FORMAT_INSTRUCTIONS = `Please provide your analysis in the following JSON format:
{
  "dishName": <string - name of the identified dish>,
  "detectedIngredients": [<array of strings - list of identified ingredients with estimated quantities>],
  "perServing": {
    "calories": <number in kcal>,
    "protein": <number in grams>,
    "carbohydrates": <number in grams>,
    "fat": <number in grams>,
    "fiber": <number in grams>,
    "sugar": <number in grams>,
    "sodium": <number in mg>
  },
  "healthScore": <number 1-10, where 10 is healthiest>,
  "healthNotes": [<array of brief observations about the nutritional profile>],
  "warnings": [<array of any health concerns or high values to be aware of>],
  "benefits": [<array of health benefits of this recipe>]
}`;

function parseAssessmentResponse(content: string, recipeId: string): NutritionalAssessment {
  // Try to extract JSON from the response (may have markdown code blocks)
  let jsonContent = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonContent);

  return {
    recipeId,
    timestamp: Date.now(),
    perServing: {
      calories: parsed.perServing.calories || 0,
      protein: parsed.perServing.protein || 0,
      carbohydrates: parsed.perServing.carbohydrates || 0,
      fat: parsed.perServing.fat || 0,
      fiber: parsed.perServing.fiber || 0,
      sugar: parsed.perServing.sugar || 0,
      sodium: parsed.perServing.sodium || 0
    },
    healthScore: parsed.healthScore || 5,
    healthNotes: parsed.healthNotes || [],
    warnings: parsed.warnings || [],
    benefits: parsed.benefits || [],
    rawResponse: content,
    // Optional fields for image assessments
    dishName: parsed.dishName,
    detectedIngredients: parsed.detectedIngredients
  };
}

async function callResponsesAPI(
  apiKey: string,
  input: string | Array<{ type: string; text?: string; image_url?: string }>,
  instructions?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    model: 'gpt-5.2',
    input
  };

  if (instructions) {
    body.instructions = instructions;
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  // Find the message output in the response array
  const messageOutput = data.output?.find((item: { type: string }) => item.type === 'message');
  const textContent = messageOutput?.content?.find((c: { type: string }) => c.type === 'output_text');
  const outputText = textContent?.text;

  if (!outputText) {
    throw new Error('No response from OpenAI');
  }

  return outputText;
}

export async function extractRecipeFromUrl(
  url: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      input: `Extract the recipe from the following URL: ${url}

Format the output clearly with:
- Recipe name
- Servings/portions (if available)
- Prep time and cook time (if available)
- Complete ingredients list with quantities
- Step-by-step instructions

Format as clean, readable text suitable for nutritional analysis.`,
      tools: [{ type: 'web_search' }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  // Find the message output in the response array
  const messageOutput = data.output?.find((item: { type: string }) => item.type === 'message');
  const textContent = messageOutput?.content?.find((c: { type: string }) => c.type === 'output_text');
  const outputText = textContent?.text;

  if (!outputText) {
    throw new Error('No response from OpenAI');
  }

  return outputText;
}

export async function assessImageNutrition(
  imageBase64: string,
  portions: string,
  apiKey: string
): Promise<NutritionalAssessment> {
  const prompt = `Analyze this image of a dish/recipe and estimate nutritional information per serving.

Number of servings shown: ${portions}

Identify what dish this is, list the ingredients you can detect with estimated quantities, then provide nutritional analysis.

${IMAGE_JSON_FORMAT_INSTRUCTIONS}

Base your estimates on:
- Visual portion sizes
- Typical recipes for this type of dish
- Standard nutritional databases
- Be realistic and provide your best estimates`;

  const input = [
    { type: 'input_text', text: prompt },
    { type: 'input_image', image_url: imageBase64 }
  ];

  const outputText = await callResponsesAPI(apiKey, input, SYSTEM_PROMPT);
  return parseAssessmentResponse(outputText, `image-${Date.now()}`);
}

export async function assessRecipeNutrition(
  recipe: Recipe,
  apiKey: string
): Promise<NutritionalAssessment> {
  const prompt = buildPrompt(recipe);
  const outputText = await callResponsesAPI(apiKey, prompt, SYSTEM_PROMPT);
  return parseAssessmentResponse(outputText, recipe.id);
}

function buildPrompt(recipe: Recipe): string {
  const servings = recipe.yield || '1';
  const ingredients = recipe.ingredients.join('\n');

  return `Analyze this recipe and provide nutritional information per serving.

Recipe: ${recipe.name}
Servings: ${servings}
Prep Time: ${recipe.prepTime}
Cook Time: ${recipe.cookTime}

Ingredients:
${ingredients}

Instructions:
${recipe.directions}

${JSON_FORMAT_INSTRUCTIONS}

Base your estimates on standard nutritional databases and consider:
- Portion sizes based on the serving count
- Cooking methods and their effects
- Common ingredient substitutions in similar recipes
- Be realistic and accurate with your estimates`;
}
