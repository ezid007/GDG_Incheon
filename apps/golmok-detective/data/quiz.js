class Quiz {
    constructor(partPhoto, hintPhoto, quizText, choices, correctAnswerIndex, answerExplanation, answerImage, geoCoordinates, quizPhoto) {
        this.partPhoto = partPhoto;
        this.hintPhoto = hintPhoto;
        this.quizText = quizText;
        this.choices = choices;
        this.correctAnswerIndex = correctAnswerIndex;
        this.answerExplanation = answerExplanation;
        this.answerImage = answerImage;
        this.geoCoordinates = geoCoordinates;
        this.quizPhoto = quizPhoto;
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
            geoCoordinates: this.geoCoordinates,
            quizPhoto: this.quizPhoto
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
        { latitude: 37.473045, longitude: 126.6188592 },
        "apps/golmok-detective/data/quiz-images/inhwamun/quiz-photo.jpg"
    ),
    new Quiz(
        "apps/golmok-detective/data/quiz-images/pinocchio-clouds/part-photo.jpg",
        undefined,
        "피노키오 뒤 흰 벽에 그려진 파란색 구름 모양 무늬는 모두 몇 개일까요? 옅은 하늘색도 포함해 주세요.",
        ["1. 3개", "2. 4개", "3. 5개", "4. 6개"],
        3,
        "파란색 계열 무늬는 모두 5개예요. 피노키오 팔 뒤의 작은 무늬 2개, 배관 뒤 큰 무늬 1개, 그 위의 옅은 하늘색 1개, 지붕 아래 1개를 세어요. 분홍색 무늬는 포함하지 않아요.",
        "apps/golmok-detective/data/quiz-images/pinocchio-clouds/answer-photo.jpg",
        undefined,
        "apps/golmok-detective/data/quiz-images/pinocchio-clouds/quiz-photo.jpg"
    )
];

export { Quiz, quizzes };
