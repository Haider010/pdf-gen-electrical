import { createPdfBuffer, createWordBuffer } from "@/lib/documents";
import { requireUser } from "@/lib/auth";
import { getProposal } from "@/lib/store";

export const runtime = "nodejs";

function fileSafe(name) {
  return name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "proposal";
}

export async function GET(_request, { params }) {
  const session = await requireUser();
  if (session.response) return session.response;

  const { id, format } = await params;
  const proposal = await getProposal(session.user.id, id);
  if (!proposal) {
    return Response.json({ error: "Proposal not found." }, { status: 404 });
  }

  const markdown = proposal.markdown || "";
  const name = fileSafe(proposal.title || proposal.projectName);

  if (format === "docx") {
    const buffer = await createWordBuffer(markdown);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${name}.docx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await createPdfBuffer(markdown);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}.pdf"`,
      },
    });
  }

  return Response.json({ error: "Unsupported export format." }, { status: 400 });
}
