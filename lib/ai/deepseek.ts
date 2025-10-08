import OpenAI from 'openai';

const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function deepseekChat(
  systemPrompt: string,
  userMessage: string,
  model: string = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
): Promise<string> {
  try {
    const response = await deepseek.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function deepseekFunctionCall(
  systemPrompt: string,
  userMessage: string,
  tools: any[],
  model: string = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
): Promise<any> {
  try {
    const response = await deepseek.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message || {};
  } catch (error) {
    console.error('DeepSeek function call error:', error);
    throw new Error('Failed to generate AI function call');
  }
}
