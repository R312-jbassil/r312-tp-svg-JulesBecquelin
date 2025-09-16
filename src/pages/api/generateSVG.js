import { OpenAI } from 'openai';

// Récupération du token d'accès à partir des variables d'environnement
const HF_TOKEN = import.meta.env.HF_TOKEN;
const HF_URL = import.meta.env.HF_URL;

// Fonction exportée pour gérer les requêtes POST
export const POST = async ({ request }) => {
    console.log('API endpoint called'); // Affiche la requête dans la console pour le débogage
    
    try {
        // Extraction du prompt du corps de la requête
        const { prompt } = await request.json();
        
        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log('Prompt received:', prompt);
        
        // Initialisation du client OpenAI avec l'URL de base et le token d'API
        const client = new OpenAI({
            baseURL: HF_URL,
            apiKey: HF_TOKEN,
        });
        
        // Utilisation du modèle Llama 3.1 spécifié
        const chatCompletion = await client.chat.completions.create({
            model: "meta-llama/Llama-3.1-8B-Instruct:novita",
            messages: [
                {
                    role: "system", 
                    content: "You are an expert SVG code generator. Generate clean, valid, and complete SVG code for the given prompt. The SVG should be colorful, detailed, and visually appealing. Return ONLY the SVG code without any explanations, markdown formatting, or additional text. The SVG must be complete and ready to use with proper xmlns attribute."
                },
                {
                    role: "user",
                    content: `Generate a complete SVG illustration of: ${prompt}. Make it colorful, detailed, and visually appealing. Include proper styling and colors. Return only the SVG code.`,    
                },
            ],
            max_tokens: 2000,
            temperature: 0.3,
        });

        // Récupération du message généré par l'API
        const message = chatCompletion.choices[0].message.content || "";
        console.log('Generated message:', message);
        
        // Recherche d'un élément SVG dans le message généré
        let svgMatch = message.match(/<svg[\s\S]*?<\/svg>/i);
        let svgCode = "";
        
        if (svgMatch) {
            svgCode = svgMatch[0];
        } else {
            // Si pas de SVG trouvé, créer un SVG de fallback
            console.log('No SVG found in response, creating fallback');
            svgCode = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
                <text x="100" y="100" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="14">
                    SVG for: ${prompt.substring(0, 20)}${prompt.length > 20 ? '...' : ''}
                </text>
            </svg>`;
        }
        
        // Retourne une réponse JSON contenant le SVG
        return new Response(JSON.stringify({ svg: svgCode }), {
            headers: { "Content-Type": "application/json" },
        });
        
    } catch (error) {
        console.error('Error generating SVG:', error);
        
        // SVG d'erreur en cas de problème
        const errorSVG = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#ffebee" stroke="#f44336" stroke-width="2"/>
            <text x="100" y="90" text-anchor="middle" fill="#f44336" font-family="Arial, sans-serif" font-size="16">Error</text>
            <text x="100" y="120" text-anchor="middle" fill="#f44336" font-family="Arial, sans-serif" font-size="12">Failed to generate SVG</text>
        </svg>`;
        
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