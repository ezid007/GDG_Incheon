export interface QuizOption {
  id: string;
  label: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Evidence {
  x: number;
  y: number;
}

export interface FieldQuiz {
  id: string;
  sourceId: string;
  sceneKind: 'field';
  explorationRegionId: 'chinatown' | 'songwol';
  placeLabel: string;
  image: string;
  imageAlt: string;
  quizImage?: string;
  quizImageAlt?: string;
  answerImage?: string;
  answerImageAlt?: string;
  hint: string;
  explanation: string;
  evidenceQuote: string;
  evidence: Evidence;
  question: string;
  options: QuizOption[];
  answerId: string;
  quizKey?: string;
  expectedAnswer?: string;
  explorationDescription?: string;
  explorationArea?: { latitude: number; longitude: number; radiusMeters: number };
  geoCoordinates?: GeoCoordinates;
}

export interface ExampleQuiz {
  id: string;
  sourceId: string;
  sceneKind: 'example';
  placeLabel: string;
  image: string;
  imageAlt: string;
  question: string;
  options: QuizOption[];
  answerId: string;
  hint: string;
  explanation: string;
  evidenceQuote: string;
  evidence: Evidence;
}

export type Mission = FieldQuiz | ExampleQuiz;

export interface QuizSupportData {
  version: string;
  title: string;
  reviews: FieldQuiz[];
  examples: ExampleQuiz[];
}

export interface MissionData {
  version: string;
  title: string;
  missions: Mission[];
}
