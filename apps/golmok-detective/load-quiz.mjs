import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QuizSupportData } from './data/quiz-schema.mjs';

const root = dirname(fileURLToPath(import.meta.url));

async function verifyImageExists(publicPath) {
  if (publicPath === undefined) return;
  try {
    await readFile(join(root, 'public', publicPath));
  } catch {
    throw new Error(`Image not found: ${publicPath}`);
  }
}

export async function loadMissionData() {
  const rawData = JSON.parse(await readFile(join(root, 'data/quiz-support.json'), 'utf8'));
  const support = QuizSupportData.validate(rawData);

  const fieldMissions = [];
  for (const review of support.reviews) {
    await Promise.all([
      verifyImageExists(review.image),
      verifyImageExists(review.quizImage),
      verifyImageExists(review.answerImage),
    ]);

    const mission = {
      ...review,
      answerId: review.options.find(opt => opt.label === review.expectedAnswer)?.id,
    };
    delete mission.quizKey;
    delete mission.expectedAnswer;

    if (!mission.answerId) {
      throw new Error(`Quiz ${review.quizKey} answer not found in options.`);
    }

    fieldMissions.push(mission);
  }

  return { version: support.version, title: support.title, missions: [...fieldMissions, ...support.examples] };
}
