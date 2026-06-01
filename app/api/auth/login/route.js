import { authenticateUser, setSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  const { email, password } = await request.json();
  const user = await authenticateUser(email || "", password || "");

  if (!user) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSession(user.id);
  return Response.json({ user: { id: user.id, email: user.email } });
}
