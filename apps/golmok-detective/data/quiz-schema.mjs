class QuizOption {
  constructor(id, label) {
    this.id = id;
    this.label = label;
  }

  static validate(data) {
    if (!data || typeof data !== 'object') throw new Error('Option must be an object');
    if (typeof data.id !== 'string' || !/^[a-d]$/.test(data.id)) throw new Error(`Invalid option id: ${data.id}`);
    if (typeof data.label !== 'string' || !data.label.trim()) throw new Error('Option label must be non-empty string');
    return new QuizOption(data.id, data.label);
  }
}

class Evidence {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static validate(data) {
    if (!data || typeof data !== 'object') throw new Error('Evidence must be an object');
    if (!Number.isFinite(data.x) || data.x < 0 || data.x > 100) throw new Error(`Invalid evidence x: ${data.x}`);
    if (!Number.isFinite(data.y) || data.y < 0 || data.y > 100) throw new Error(`Invalid evidence y: ${data.y}`);
    return new Evidence(data.x, data.y);
  }
}

class GeoCoordinates {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  static validate(data) {
    if (data === undefined) return undefined;
    if (!data || typeof data !== 'object') throw new Error('GeoCoordinates must be an object');
    if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) {
      throw new Error(`Invalid latitude: ${data.latitude}`);
    }
    if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) {
      throw new Error(`Invalid longitude: ${data.longitude}`);
    }
    return new GeoCoordinates(data.latitude, data.longitude);
  }
}

class FieldQuiz {
  constructor(data) {
    Object.assign(this, data);
  }

  static validate(data) {
    if (!data || typeof data !== 'object') throw new Error('Quiz must be an object');

    const required = ['id', 'sourceId', 'sceneKind', 'explorationRegionId', 'placeLabel', 'image', 'imageAlt',
      'hint', 'explanation', 'evidenceQuote', 'evidence', 'quizKey', 'expectedAnswer', 'question', 'options'];
    for (const field of required) {
      if (!(field in data)) throw new Error(`Missing required field: ${field}`);
    }

    if (typeof data.id !== 'string' || !/^[a-z0-9-]+$/.test(data.id)) throw new Error(`Invalid id: ${data.id}`);
    if (typeof data.sourceId !== 'string' || !data.sourceId.trim()) throw new Error('Invalid sourceId');
    if (data.sceneKind !== 'field') throw new Error('sceneKind must be "field"');
    if (!['chinatown', 'songwol'].includes(data.explorationRegionId)) throw new Error(`Invalid explorationRegionId: ${data.explorationRegionId}`);
    if (typeof data.placeLabel !== 'string' || !data.placeLabel.trim()) throw new Error('Invalid placeLabel');
    if (typeof data.image !== 'string' || !/^assets\/.*\.(svg|jpg|jpeg|png|webp)$/.test(data.image)) {
      throw new Error(`Invalid image path: ${data.image}`);
    }
    if (typeof data.imageAlt !== 'string' || !data.imageAlt.trim()) throw new Error('Invalid imageAlt');
    if (data.quizImage && (typeof data.quizImage !== 'string' || !/^assets\/.*\.(svg|jpg|jpeg|png|webp)$/.test(data.quizImage))) {
      throw new Error(`Invalid quizImage path: ${data.quizImage}`);
    }
    if (data.answerImage && (typeof data.answerImage !== 'string' || !/^assets\/.*\.(svg|jpg|jpeg|png|webp)$/.test(data.answerImage))) {
      throw new Error(`Invalid answerImage path: ${data.answerImage}`);
    }
    if (typeof data.hint !== 'string' || !data.hint.trim()) throw new Error('Invalid hint');
    if (typeof data.explanation !== 'string' || !data.explanation.trim()) throw new Error('Invalid explanation');
    if (typeof data.evidenceQuote !== 'string' || !data.evidenceQuote.trim()) throw new Error('Invalid evidenceQuote');
    if (typeof data.quizKey !== 'string' || !/^[a-z0-9-]+$/.test(data.quizKey)) throw new Error(`Invalid quizKey: ${data.quizKey}`);
    if (typeof data.expectedAnswer !== 'string' || !data.expectedAnswer.trim()) throw new Error('Invalid expectedAnswer');
    if (typeof data.question !== 'string' || !data.question.trim()) throw new Error('Invalid question');
    if (!Array.isArray(data.options) || data.options.length !== 4) throw new Error('options must be array of 4 items');

    const validated = {
      ...data,
      evidence: Evidence.validate(data.evidence),
      options: data.options.map(opt => QuizOption.validate(opt)),
      geoCoordinates: GeoCoordinates.validate(data.geoCoordinates),
    };

    if (data.quizImageAlt && !validated.quizImage) throw new Error('quizImageAlt requires quizImage');
    if (data.answerImageAlt && !validated.answerImage) throw new Error('answerImageAlt requires answerImage');

    return new FieldQuiz(validated);
  }
}

class ExampleQuiz {
  constructor(data) {
    Object.assign(this, data);
  }

  static validate(data) {
    if (!data || typeof data !== 'object') throw new Error('Example must be an object');

    const required = ['id', 'sourceId', 'sceneKind', 'placeLabel', 'image', 'imageAlt',
      'question', 'options', 'answerId', 'hint', 'explanation', 'evidenceQuote', 'evidence'];
    for (const field of required) {
      if (!(field in data)) throw new Error(`Missing required field: ${field}`);
    }

    if (typeof data.id !== 'string' || !/^[a-z0-9-]+$/.test(data.id)) throw new Error(`Invalid id: ${data.id}`);
    if (typeof data.sourceId !== 'string' || !data.sourceId.trim()) throw new Error('Invalid sourceId');
    if (data.sceneKind !== 'example') throw new Error('sceneKind must be "example"');
    if (typeof data.placeLabel !== 'string' || !data.placeLabel.trim()) throw new Error('Invalid placeLabel');
    if (typeof data.image !== 'string' || !/^assets\/.*\.(svg|jpg|jpeg|png|webp)$/.test(data.image)) {
      throw new Error(`Invalid image path: ${data.image}`);
    }
    if (typeof data.imageAlt !== 'string' || !data.imageAlt.trim()) throw new Error('Invalid imageAlt');
    if (typeof data.question !== 'string' || !data.question.trim()) throw new Error('Invalid question');
    if (!Array.isArray(data.options) || data.options.length < 3 || data.options.length > 4) {
      throw new Error('options must be array of 3-4 items');
    }
    if (typeof data.answerId !== 'string' || !/^[a-d]$/.test(data.answerId)) throw new Error(`Invalid answerId: ${data.answerId}`);
    if (typeof data.hint !== 'string' || !data.hint.trim()) throw new Error('Invalid hint');
    if (typeof data.explanation !== 'string' || !data.explanation.trim()) throw new Error('Invalid explanation');
    if (typeof data.evidenceQuote !== 'string' || !data.evidenceQuote.trim()) throw new Error('Invalid evidenceQuote');

    const validated = {
      ...data,
      evidence: Evidence.validate(data.evidence),
      options: data.options.map(opt => QuizOption.validate(opt)),
    };

    return new ExampleQuiz(validated);
  }
}

class QuizSupportData {
  constructor(version, title, reviews, examples) {
    this.version = version;
    this.title = title;
    this.reviews = reviews;
    this.examples = examples;
  }

  static validate(data) {
    if (!data || typeof data !== 'object') throw new Error('Data must be an object');
    if (typeof data.version !== 'string' || !data.version.trim()) throw new Error('Invalid version');
    if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('Invalid title');
    if (!Array.isArray(data.reviews)) throw new Error('reviews must be array');
    if (!Array.isArray(data.examples)) throw new Error('examples must be array');

    const reviews = data.reviews.map(r => FieldQuiz.validate(r));
    const examples = data.examples.map(e => ExampleQuiz.validate(e));

    const allIds = new Set();
    for (const quiz of [...reviews, ...examples]) {
      if (allIds.has(quiz.id)) throw new Error(`Duplicate quiz id: ${quiz.id}`);
      allIds.add(quiz.id);
    }

    return new QuizSupportData(data.version, data.title, reviews, examples);
  }
}

export { QuizOption, Evidence, GeoCoordinates, FieldQuiz, ExampleQuiz, QuizSupportData };
