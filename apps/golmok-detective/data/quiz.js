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
        "apps/golmok-detective/data/quiz-images/inhwamun/part-photo.jpg",
        "apps/golmok-detective/data/quiz-images/inhwamun/hint-photo.jpg",
        "다음 사진 속 황금빛 패루(牌樓)에 가려진 한자 현판에 적힌 글자는 무엇일까요?",
        ["1. 仁華門", "2. 中華門", "3. 華僑門", "4. 仁川門"],
        1,
        "인천 차이나타운 입구에 세워진 패루 중 하나로, '어질고 화목하다'는 뜻을 담은 이름입니다.",
        "apps/golmok-detective/data/quiz-images/inhwamun/answer-photo.jpg",
        { latitude: 37.473045, longitude: 126.6188592 }
    )
];

export { Quiz, quizzes };