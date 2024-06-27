import { AnthropicStream, StreamingTextResponse } from 'ai'

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
    // Extract the `prompt` from the body of the request
    const { prompt } = await req.json()


    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not defined');
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
    }

    const response = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: "claude-3-opus-20240229",
            max_tokens: 3000,
            max_tokens_to_sample: 3000,
            temperature: 0,
            prompt: `Human: ${prompt}\n\nAssistant:`,
            stream: true
        })
    })

    console.log('Response from AI', response)

    // Convert the response into a friendly text-stream
    const stream = AnthropicStream(response)

    // Respond with the stream
    return new StreamingTextResponse(stream)
}
