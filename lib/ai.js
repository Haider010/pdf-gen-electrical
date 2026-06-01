import OpenAI from "openai";
import { readAppConfig } from "./config";

const proposalSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "executiveSummary",
    "scopeOfWorks",
    "technicalApproach",
    "inclusions",
    "exclusions",
    "assumptions",
    "commercialTerms",
    "schedule",
    "clientResponsibilities",
    "nextSteps",
  ],
  properties: {
    title: { type: "string" },
    executiveSummary: { type: "string" },
    scopeOfWorks: { type: "array", items: { type: "string" } },
    technicalApproach: { type: "array", items: { type: "string" } },
    inclusions: { type: "array", items: { type: "string" } },
    exclusions: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    commercialTerms: { type: "array", items: { type: "string" } },
    schedule: { type: "array", items: { type: "string" } },
    clientResponsibilities: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
  },
};

function formatAnswers(questionnaire, answers) {
  const lines = [];

  for (const step of questionnaire.steps) {
    lines.push(`\n## ${step.title}`);
    for (const field of step.fields) {
      const value = answers[field.id];
      if (Array.isArray(value) && value.length) {
        lines.push(`- ${field.label}: ${value.join(", ")}`);
      } else if (value) {
        lines.push(`- ${field.label}: ${value}`);
      }
    }
  }

  return lines.join("\n");
}

export function proposalToMarkdown(document, meta = {}) {
  const list = (items = []) => items.map((item) => `- ${item}`).join("\n");
  const details = [
    meta.clientName ? `Client: ${meta.clientName}` : null,
    meta.siteAddress ? `Site: ${meta.siteAddress}` : null,
    meta.proposalDate ? `Date: ${meta.proposalDate}` : null,
  ].filter(Boolean);

  return [
    `# ${document.title}`,
    details.join("\n"),
    "## Executive Summary",
    document.executiveSummary,
    "## Scope of Works",
    list(document.scopeOfWorks),
    "## Technical Approach",
    list(document.technicalApproach),
    "## Inclusions",
    list(document.inclusions),
    "## Exclusions",
    list(document.exclusions),
    "## Assumptions",
    list(document.assumptions),
    "## Commercial Terms",
    list(document.commercialTerms),
    "## Schedule",
    list(document.schedule),
    "## Client Responsibilities",
    list(document.clientResponsibilities),
    "## Next Steps",
    list(document.nextSteps),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function fallbackProposal(questionnaire, answers) {
  const clientName = answers.clientName || "the client";
  const projectName = answers.projectName || "Electrical Works Proposal";
  const price = answers.price || "To be confirmed";

  const document = {
    title: `${projectName} - Electrical Works Proposal`,
    executiveSummary: `We are pleased to provide this proposal for ${clientName}. The scope has been prepared from the information supplied and is intended to give a clear basis for the electrical works, commercial terms, assumptions, and exclusions.`,
    scopeOfWorks: [
      answers.workSummary || "Complete the electrical works described in the contractor questionnaire.",
      ...(answers.systemsIncluded || []).map((item) => `Allow for ${item.toLowerCase()} works as part of the agreed scope.`),
    ],
    technicalApproach: [
      "Coordinate works with site access, existing services, and other trades before installation.",
      "Install wiring, containment, equipment, accessories, labeling, and terminations using good electrical trade practice.",
      answers.testing || "Carry out testing and commissioning suitable for the installed works before handover.",
    ],
    inclusions: [
      "Labor, standard installation materials, setup, installation, testing, and clean handover for the described scope.",
      answers.materials || "Standard contractor-selected materials suitable for the application.",
    ],
    exclusions: [
      answers.exclusions || "Builder's works, patching, painting, utility company charges, concealed defects, and works not specifically described above.",
    ],
    assumptions: [
      answers.assumptions || "Normal working access will be available and existing electrical infrastructure is suitable unless otherwise noted.",
      answers.compliance || "Works will be completed in line with applicable electrical requirements for the jurisdiction.",
    ],
    commercialTerms: [
      `Quoted price: ${price}.`,
      answers.taxTreatment ? `Tax treatment: ${answers.taxTreatment}.` : "Tax treatment to be confirmed.",
      answers.paymentTerms || "Payment terms to be agreed before commencement.",
      answers.validity ? `This proposal is valid for ${answers.validity}.` : "Proposal validity to be confirmed.",
    ],
    schedule: [
      answers.timeline || "Program to be agreed following acceptance and confirmation of site readiness.",
    ],
    clientResponsibilities: [
      answers.clientResponsibilities || "Provide access, approvals, shutdown windows, and clear work areas as required.",
      answers.accessConstraints || "Advise of any access restrictions or site rules before works commence.",
    ],
    nextSteps: [
      "Confirm acceptance of this proposal and any required adjustments to scope.",
      "Agree start date, access arrangements, and any shutdown or coordination requirements.",
    ],
  };

  return {
    document,
    markdown: proposalToMarkdown(document, answers),
    generatedBy: "local-demo",
  };
}

export async function generateProposal(answers) {
  const { questionnaire, prompt } = await readAppConfig();

  if (!process.env.OPENAI_API_KEY) {
    return fallbackProposal(questionnaire, answers);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const input = [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: [
        `Company name: ${questionnaire.companyName}`,
        `Domain knowledge:\n${questionnaire.domainKnowledge}`,
        `Proposal examples and tone:\n${questionnaire.proposalExamples}`,
        `Questionnaire answers:\n${formatAnswers(questionnaire, answers)}`,
      ].join("\n\n"),
    },
  ];

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input,
    text: {
      format: {
        type: "json_schema",
        name: "electrical_proposal",
        strict: true,
        schema: proposalSchema,
      },
    },
  });

  const document = JSON.parse(response.output_text);
  return {
    document,
    markdown: proposalToMarkdown(document, answers),
    generatedBy: "openai",
    model: response.model,
  };
}
