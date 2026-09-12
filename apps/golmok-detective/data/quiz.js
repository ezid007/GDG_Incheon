class Quiz {
    constructor(partPhoto, hintPhoto, quizText, choices, correctAnswerIndex, answerExplanation, answerImage, geoCoordinates) {
        this.partPhoto = partPhoto;
        this.hintPhoto = hintPhoto;
        this.quizText = quizText;
        this.choices = choices;
        this.correctAnswerIndex = correctAnswerIndex;
        this.answerExplanation = answerExplanation;
        this.answerImage = answerImage;
        this.geoCoordinates = geoCoordinates;
    }

    toJson() {
        return {
            partPhoto: this.partPhoto,
            hintPhoto: this.hintPhoto,
            quizText: this.quizText,
            choices: this.choices,
            correctAnswerIndex: this.correctAnswerIndex,
            answerExplanation: this.answerExplanation,
            answerImage: this.answerImage,
            geoCoordinates: this.geoCoordinates
        };
    }
}

const quizzes = [
    new Quiz(
        "/Users/quokkaman/.openclaw/workspace/media/inbound/openclaw-staged-0e3a9150-1284-4899-b8c5-ad580e8b5426/input-41e5b8bf-032e-4799-8531-61b767150242.jpg",
        "/Users/quokkaman/.openclaw/workspace/media/inbound/openclaw-staged-39a0db48-d8f3-44af-b75a-3bc446661660/input-80049834-981b-4b50-8fe7-a25354b2ba8b.jpg",
        "다음 사진 속 황금빛 패루(牌樓)에 가려진 한자 현판에 적힌 글자는 무엇일까요?",
        ["1. 仁華門", "2. 中華門", "3. 華僑門", "4. 仁川門"],
        1,
        "인천 차이나타운 입구에 세워진 패루 중 하나로, '어질고 화목하다'는 뜻을 담은 이름입니다.",
        "/Users/quokkaman/.openclaw/workspace/media/inbound/openclaw-staged-56977528-bc9b-46da-8a44-0c7da21b68ec/input-89aa2e92-734f-4b14-8dc7-af4dc7a84e60.jpg",
        { latitude: 37.473045, longitude: 126.6188592 }
    )
];

export { Quiz, quizzes };