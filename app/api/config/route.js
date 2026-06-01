import { readAppConfig, writeAppConfig } from "@/lib/config";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireUser();
  if (session.response) return session.response;

  const config = await readAppConfig();
  return Response.json(config);
}

export async function PUT(request) {
  const session = await requireUser();
  if (session.response) return session.response;

  try {
    const payload = await request.json();
    if (!payload.questionnaire?.steps || !payload.prompt) {
      return Response.json({ error: "Questionnaire steps and prompt are required." }, { status: 400 });
    }

    await writeAppConfig(payload);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || "Could not save configuration." }, { status: 400 });
  }
}
