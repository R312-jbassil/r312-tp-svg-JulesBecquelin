import { OpenAI } from 'openai';

// Récupération du token d'accès à partir des variables d'environnement
const HF_TOKEN = import.meta.env.HF_TOKEN;
const HF_URL = import.meta.env.HF_URL;

// Fonction exportée pour gérer les requêtes POST
export const POST = async ({ request }) => {
    console.log('API endpoint called');
    
    try {
        // Extraction des messages du corps de la requête
        const messages = await request.json();
        
        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: "Messages array is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log('Messages received:', messages);
        
        // Initialisation du client OpenAI avec l'URL de base et le token d'API
        const client = new OpenAI({
            baseURL: HF_URL,
            apiKey: HF_TOKEN,
        });
        
        // Création du message système pour guider le modèle
        let SystemMessage = {
            role: "system",
            content: "You are an expert SVG code generator. Generate clean, valid, and complete SVG code based on the conversation. The SVG should be colorful, detailed, and visually appealing. Return ONLY the SVG code without any explanations, markdown formatting, or additional text. Make sure to include ids for each part of the generated SVG. The SVG must be complete and ready to use with proper xmlns attribute."
        };
        
        // Utilisation du modèle Llama 3.1 spécifié
        const chatCompletion = await client.chat.completions.create({
            model: "meta-llama/Llama-3.1-8B-Instruct:novita",
            messages: [SystemMessage, ...messages],
            max_tokens: 2000,
            temperature: 0.3,
        });

        // Récupération du message généré par l'API
        const message = chatCompletion.choices[0].message || { role: "assistant", content: "" };
        console.log('Generated message:', message);
        
        // Recherche d'un élément SVG dans le message
        const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);
        
        // Si un SVG est trouvé, le remplace dans le message, sinon laisse une chaîne vide
        if (svgMatch) {
            message.content = svgMatch[0];
        } else {
            // Si pas de SVG trouvé, créer un SVG de fallback
            console.log('No SVG found in response, creating fallback');
            const userPrompt = messages[messages.length - 1]?.content || "default";
            message.content = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
                <text x="100" y="100" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="14">
                    SVG for: ${userPrompt.substring(0, 20)}${userPrompt.length > 20 ? '...' : ''}
                </text>
            </svg>`;
        }
        
        // Retourne une réponse JSON contenant le message complet avec SVG
        return new Response(JSON.stringify({ svg: message }), {
            headers: { "Content-Type": "application/json" },
        });
        
    } catch (error) {
        console.error('Error generating SVG:', error);
        
        // SVG d'erreur en cas de problème
        const errorSVG = {
            role: "assistant",
            content: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#ffebee" stroke="#f44336" stroke-width="2"/>
                <text x="100" y="90" text-anchor="middle" fill="#f44336" font-family="Arial, sans-serif" font-size="16">Error</text>
                <text x="100" y="120" text-anchor="middle" fill="#f44336" font-family="Arial, sans-serif" font-size="12">Failed to generate SVG</text>
            </svg>`
        };
        
        return new Response(JSON.stringify({ 
            svg: errorSVG,
            error: "Failed to generate SVG",
            details: error.message 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};