import path from "path";

export const rootDir = process.cwd();
export const configDir = path.join(rootDir, "config");
export const dataDir = path.join(rootDir, "data");
export const dbPath = path.join(dataDir, "db.json");
export const dbTemplatePath = path.join(dataDir, "db.template.json");
export const questionnairePath = path.join(configDir, "questionnaire.json");
export const promptPath = path.join(configDir, "prompt.md");
