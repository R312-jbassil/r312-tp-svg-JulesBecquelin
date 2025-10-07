import pb from "../utils/pb";

export const onRequest = async (context, next) => {
    const cookie = context.cookies.get("pb_auth")?.value;
    if (cookie) {
        pb.authStore.loadFromCookie(cookie); // Charge les infos d'auth depuis le cookie
        if (pb.authStore.isValid) {
            // Si le token est valide, ajoute les données utilisateur dans Astro.locals
            context.locals.user = pb.authStore.record;
        }
    }

    // Pour les routes API, on exige l'authentification sauf pour /api/login
    if (context.url.pathname.startsWith('/api/')) {
        if (!context.locals.user && context.url.pathname !== '/api/login') {
            // Si l'utilisateur n'est pas connecté, on retourne une erreur 401 (non autorisé)
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        return next(); // Continue le traitement normal
    }

    // Pour les autres pages, si l'utilisateur n'est pas connecté, on le redirige vers /login
    if (!context.locals.user) {
        if (context.url.pathname !== '/login' && context.url.pathname !== '/')
            return Response.redirect(new URL('/login', context.url), 303);
    }
    return next(); 
};


