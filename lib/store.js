import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { dataDir, dbPath, dbTemplatePath } from "./paths";

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    const template = await fs.readFile(dbTemplatePath, "utf8");
    await fs.writeFile(dbPath, template, "utf8");
  }
}

export async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw);
}

export async function writeDb(db) {
  await ensureDb();
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

export async function findUserByEmail(email) {
  const db = await readDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findUserById(userId) {
  const db = await readDb();
  return db.users.find((user) => user.id === userId) || null;
}

export async function createUser({ email, passwordHash }) {
  const db = await readDb();
  const now = new Date().toISOString();
  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
    createdAt: now,
  };

  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function listProposals(userId) {
  const db = await readDb();
  return db.proposals
    .filter((proposal) => proposal.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function getProposal(userId, proposalId) {
  const db = await readDb();
  return db.proposals.find((proposal) => proposal.userId === userId && proposal.id === proposalId) || null;
}

export async function createProposal(userId, payload) {
  const db = await readDb();
  const now = new Date().toISOString();
  const proposal = {
    id: randomUUID(),
    userId,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    ...payload,
  };

  db.proposals.push(proposal);
  await writeDb(db);
  return proposal;
}

export async function updateProposal(userId, proposalId, patch) {
  const db = await readDb();
  const index = db.proposals.findIndex((proposal) => proposal.userId === userId && proposal.id === proposalId);

  if (index === -1) {
    return null;
  }

  db.proposals[index] = {
    ...db.proposals[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await writeDb(db);
  return db.proposals[index];
}
