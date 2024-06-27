import { AnthropicStream, OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai';

const openai = new OpenAI();

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
    // Extract the `prompt` from the body of the request
    const { prompt } = await req.json()


    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPEN_API_KEY is not defined');
    }


    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: `Human: ${prompt}\n\nAssistant:` }],
        stream: true,
    }).asResponse();


    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)

    // Respond with the stream
    return new StreamingTextResponse(stream)
}
