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

const SAFE_FALLBACK_PROMPTS = [
    "a cat",
    "a robot",
];

export async function generateImage(prompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey)
        throw new Error("No API key. Add your Pollinations key to continue.");

    const url = `${BASE_URL}/image/${encodeURIComponent(prompt)}?key=${encodeURIComponent(apiKey)}`;
    let response = await fetch(url);

    if (response.status === 401) {
        for (const fallbackPrompt of SAFE_FALLBACK_PROMPTS) {
            const fallbackUrl = `${BASE_URL}/image/${encodeURIComponent(fallbackPrompt)}?key=${encodeURIComponent(apiKey)}`;
            response = await fetch(fallbackUrl);
            if (response.ok) break;
        }
    }

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Image generation failed: ${response.status}: ${body}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export async function generateAudio(text: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey)
        throw new Error("No API key. Add your Pollinations key to continue.");

    const url = `${BASE_URL}/audio/${encodeURIComponent(text)}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Audio generation failed: ${response.status}: ${body}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}
