import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export const POST = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  try {
    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    cookies.set("pb_auth", pb.authStore.exportToCookie(), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return new Response(JSON.stringify({ user: authData.record }), { status: 200 });
  } catch (err) {
    console.error("Erreur de connexion :", err);
    return new Response(JSON.stringify({ error: "Identifiants invalides" }), { status: 401 });
  }
};