export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }
    const { frictionInput } = req.body;
    if (!frictionInput) {
        return res.status(400).json({ error: 'Friction input is required.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server config error: API key missing.' });
    }
    const systemInstruction = "You are an expert SaaS builder, digital product strategist, and productivity analyst. The user will provide a description of a daily frustration, friction point, or repetitive task they face. Your job is to invent 3 distinct digital tools (e.g., a Notion template, a micro web app, an automation script, or a spreadsheet) they could build to solve this specific problem for themselves, which could later be packaged and monetized to others in their niche.";
    const payload = {
        contents: [{ parts: [{ text: `My friction point: ${frictionInput}` }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    ideas: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING" },
                                type: { type: "STRING" },
                                description: { type: "STRING" },
                                monetizationScore: { type: "INTEGER" },
                                launchHook: { type: "STRING" }
                            }
                        }
                    }
                }
            }
        }
    };
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const result = await response.json();
        const rawText = result.candidates[0].content.parts[0].text;
        const parsedData = JSON.parse(rawText);
        return res.status(200).json(parsedData);
    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: 'Failed to generate ideas.' });
    }
}
