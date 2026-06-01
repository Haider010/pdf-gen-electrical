import { promises as fs } from "fs";
import { promptPath, questionnairePath } from "./paths";

export async function readAppConfig() {
  const [questionnaireRaw, prompt] = await Promise.all([
    fs.readFile(questionnairePath, "utf8"),
    fs.readFile(promptPath, "utf8"),
  ]);

  return {
    questionnaire: JSON.parse(questionnaireRaw),
    prompt,
  };
}

export async function writeAppConfig({ questionnaire, prompt }) {
  JSON.parse(JSON.stringify(questionnaire));

  await Promise.all([
    fs.writeFile(questionnairePath, JSON.stringify(questionnaire, null, 2), "utf8"),
    fs.writeFile(promptPath, prompt, "utf8"),
  ]);
}
