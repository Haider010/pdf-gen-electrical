import { requireUser } from "@/lib/auth";
import { getProposal, updateProposal } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const session = await requireUser();
  if (session.response) return session.response;

  const { id } = await params;
  const proposal = await getProposal(session.user.id, id);
  if (!proposal) {
    return Response.json({ error: "Proposal not found." }, { status: 404 });
  }

  return Response.json({ proposal });
}

export async function PATCH(request, { params }) {
  const session = await requireUser();
  if (session.response) return session.response;

  const { id } = await params;
  const body = await request.json();
  const proposal = await updateProposal(session.user.id, id, {
    title: body.title,
    markdown: body.markdown,
    status: body.status || "draft",
  });

  if (!proposal) {
    return Response.json({ error: "Proposal not found." }, { status: 404 });
  }

  return Response.json({ proposal });
}
