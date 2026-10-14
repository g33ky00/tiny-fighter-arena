const BASE_URL = "https://gen.pollinations.ai";

const getApiKey = (): string => {
    try {
        return localStorage.getItem("tfa_api_key") ?? "";
    } catch {
        return "";
    }
};

export interface TextResponse {
    choices: { message: { content: string } }[];
}

export async function generateText(
    messages: { role: string; content: string }[],
    model = "openai",
): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey)
        throw new Error("No API key. Add your Pollinations key to continue.");

    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ messages, model }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Pollinations API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as TextResponse;
    return data.choices?.[0]?.message?.content ?? "";
}

export async function generateImage(prompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey)
        throw new Error("No API key. Add your Pollinations key to continue.");

    const response = await fetch(`${BASE_URL}/v1/images/generations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt, model: "flux" }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Image generation failed: ${response.status}: ${body}`);
    }

    const data = (await response.json()) as { data: { url: string }[] };
    const url = data.data?.[0]?.url;
    if (!url) throw new Error("No image URL in response");
    return url;
}

export async function generateAudio(text: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey)
        throw new Error("No API key. Add your Pollinations key to continue.");

    const response = await fetch(`${BASE_URL}/v1/audio/speech`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: text, voice: "alloy" }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Audio generation failed: ${response.status}: ${body}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}
