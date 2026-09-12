import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const publicImagePattern = /^assets\/quiz\/[a-z0-9-]+\/[a-z0-9-]+\.(?:svg|jpg|jpeg|png|webp)$/;

async function verifyImageExists(publicPath) {
  if (publicPath === undefined) return;
  if (typeof publicPath !== 'string' || !publicImagePattern.test(publicPath)) {
    throw new Error(`Invalid public image path: ${publicPath}`);
  }
  try {
    await readFile(join(root, 'public', publicPath));
  } catch {
    throw new Error(`Image not found: ${publicPath}`);
  }
}

export async function loadMissionData() {
  const support = JSON.parse(await readFile(join(root, 'data/quiz-support.json'), 'utf8'));
  if (!Array.isArray(support.reviews) || !Array.isArray(support.examples)) {
    throw new Error('Review support data is invalid.');
  }

  const fieldMissions = [];
  for (const review of support.reviews) {
    if (!review || typeof review.quizKey !== 'string' || !/^[a-z0-9-]+$/.test(review.quizKey)) {
      throw new Error('Quiz reviews require unique quiz keys.');
    }
    if (!Array.isArray(review.options) || review.options.length !== 4
      || !review.options.every(opt => typeof opt.id === 'string' && typeof opt.label === 'string')) {
      throw new Error(`Quiz ${review.quizKey} requires exactly four options with id and label.`);
    }
    if (typeof review.question !== 'string' || !review.question.trim()) {
      throw new Error(`Quiz ${review.quizKey} requires a question.`);
    }

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
