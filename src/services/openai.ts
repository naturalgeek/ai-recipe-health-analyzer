import type { Recipe, NutritionalAssessment } from '../types/recipe';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function assessRecipeNutrition(
  recipe: Recipe,
  apiKey: string
): Promise<NutritionalAssessment> {
  const prompt = buildPrompt(recipe);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional nutritionist and dietitian. Analyze recipes and provide accurate nutritional information per serving.
Always respond with valid JSON in the exact format specified. Be precise with your estimates based on standard nutritional databases.
Consider cooking methods and their effects on nutrition.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content);

  return {
    recipeId: recipe.id,
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
    rawResponse: content
  };
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

Please provide your analysis in the following JSON format:
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
}

Base your estimates on standard nutritional databases and consider:
- Portion sizes based on the serving count
- Cooking methods and their effects
- Common ingredient substitutions in similar recipes
- Be realistic and accurate with your estimates`;
}
