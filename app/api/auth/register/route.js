import { registerUser, setSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || password.length < 6) {
      return Response.json({ error: "Enter an email and a password with at least 6 characters." }, { status: 400 });
    }

    const user = await registerUser(email, password);
    await setSession(user.id);

    return Response.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    return Response.json({ error: error.message || "Could not create account." }, { status: 400 });
  }
}
