import { generateProposal } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { createProposal, listProposals } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireUser();
  if (session.response) return session.response;

  const proposals = await listProposals(session.user.id);
  return Response.json({ proposals });
}

export async function POST(request) {
  const session = await requireUser();
  if (session.response) return session.response;

  try {
    const { answers } = await request.json();
    if (!answers?.clientName || !answers?.projectName || !answers?.workSummary || !answers?.price) {
      return Response.json({ error: "Client name, project name, work summary, and price are required." }, { status: 400 });
    }

    const generated = await generateProposal(answers);
    const proposal = await createProposal(session.user.id, {
      title: generated.document.title,
      clientName: answers.clientName,
      projectName: answers.projectName,
      siteAddress: answers.siteAddress || "",
      answers,
      document: generated.document,
      markdown: generated.markdown,
      generatedBy: generated.generatedBy,
      model: generated.model || null,
    });

    return Response.json({ proposal });
  } catch (error) {
    return Response.json({ error: error.message || "Could not generate proposal." }, { status: 500 });
  }
}
