import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quizzes } from './data/quiz.js';

const root = dirname(fileURLToPath(import.meta.url));
const sourceImagePattern = /^apps\/golmok-detective\/data\/quiz-images\/([a-z0-9-]+)\/([a-z0-9-]+\.(?:svg|jpg|jpeg|png|webp))$/;
const publicImagePattern = /^assets\/[a-z0-9-]+\.(?:svg|jpg|jpeg|png|webp)$/;

function sourceImageParts(path, quizKey) {
  const parts = typeof path === 'string' ? path.match(sourceImagePattern) : null;
  if (!parts || (quizKey !== undefined && parts[1] !== quizKey)) {
    throw new Error('Quiz images must use a reviewed quiz-images directory.');
  }
  return { quizKey: parts[1], filename: parts[2] };
}

async function verifyReviewedImage(sourcePath, publicPath, quizKey, required = false) {
  if (!required && sourcePath === undefined && publicPath === undefined) return;
  const source = sourceImageParts(sourcePath, quizKey);
  if (typeof publicPath !== 'string' || !publicImagePattern.test(publicPath)) {
    throw new Error(`Quiz ${quizKey} needs a reviewed public image path.`);
  }
  const [sourceBytes, publicBytes] = await Promise.all([
    readFile(join(root, 'data/quiz-images', source.quizKey, source.filename)),
    readFile(join(root, 'public', publicPath)),
  ]);
  if (!sourceBytes.equals(publicBytes)) {
    throw new Error(`Quiz ${quizKey} image differs from its reviewed public copy. Review the new image before publishing.`);
  }
}

export async function loadMissionData() {
  const support = JSON.parse(await readFile(join(root, 'data/quiz-support.json'), 'utf8'));
  if (!Array.isArray(quizzes) || !Array.isArray(support.reviews) || !Array.isArray(support.examples)) {
    throw new Error('Quiz source or review support data is invalid.');
  }
  const reviews = new Map();
  for (const review of support.reviews) {
    if (!review || typeof review.quizKey !== 'string' || !/^[a-z0-9-]+$/.test(review.quizKey)
      || reviews.has(review.quizKey)) {
      throw new Error('Quiz reviews require unique quiz keys.');
    }
    reviews.set(review.quizKey, review);
  }

  const seen = new Set();
  const fieldMissions = [];
  for (const quiz of quizzes) {
    const { quizKey } = sourceImageParts(quiz?.partPhoto);
    const review = reviews.get(quizKey);
    if (!review || seen.has(quizKey)) throw new Error(`Quiz ${quizKey} requires a unique review before publishing.`);
    seen.add(quizKey);
    if (!Array.isArray(quiz.choices) || quiz.choices.length !== 4
      || !quiz.choices.every(choice => typeof choice === 'string')) {
      throw new Error(`Quiz ${quizKey} requires exactly four text choices.`);
    }
    if (!Number.isInteger(quiz.correctAnswerIndex) || quiz.correctAnswerIndex < 1 || quiz.correctAnswerIndex > 4) {
      throw new Error(`Quiz ${quizKey} correctAnswerIndex must be a 1-based choice number from 1 to 4.`);
    }
    const options = quiz.choices.map((choice, index) => ({
      id: String.fromCharCode(97 + index),
      label: choice.replace(/^\s*[1-4]\.\s*/, '').trim(),
    }));
    const answer = options[quiz.correctAnswerIndex - 1];
    if (typeof review.expectedAnswer !== 'string' || !review.expectedAnswer.trim()
      || answer.label !== review.expectedAnswer.trim()) {
      throw new Error(`Quiz ${quizKey} answer differs from its reviewed answer.`);
    }
    await Promise.all([
      verifyReviewedImage(quiz.partPhoto, review.image, quizKey, true),
      verifyReviewedImage(quiz.quizPhoto, review.quizImage, quizKey),
      verifyReviewedImage(quiz.answerImage, review.answerImage, quizKey),
    ]);
    const mission = {
      ...review,
      question: quiz.quizText,
      options,
      answerId: answer.id,
      geoCoordinates: quiz.geoCoordinates,
    };
    delete mission.quizKey;
    delete mission.expectedAnswer;
    fieldMissions.push(mission);
  }
  return { version: support.version, title: support.title, missions: [...fieldMissions, ...support.examples] };
}
