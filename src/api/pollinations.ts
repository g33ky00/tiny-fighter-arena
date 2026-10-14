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

    const response = await fetch(`${BASE_URL}/text`, {
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

    const url = `${BASE_URL}/image/${encodeURIComponent(prompt)}`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
        throw new Error(`Image generation failed: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export async function generateAudio(text: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey)
        throw new Error("No API key. Add your Pollinations key to continue.");

    const url = `${BASE_URL}/audio/${encodeURIComponent(text)}`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
        throw new Error(`Audio generation failed: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}
