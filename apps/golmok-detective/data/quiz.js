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
        "피노키오 뒤쪽 흰 벽면과 흰색 함의 문에 그려진 구름 모양 무늬는 모두 몇 개일까요?",
        ["1. 3개", "2. 4개", "3. 5개", "4. 6개"],
        3,
        "흰 벽면의 진한 파랑, 위쪽 청록, 옅은 분홍, 옅은 민트와 흰색 함 위 분홍 무늬까지 모두 5개예요. 갈라진 꼬리선을 따로 세지 않고 무늬 한 덩어리를 1개로 세어요.",
        "apps/golmok-detective/data/quiz-images/pinocchio-clouds/answer-photo.jpg",
        undefined,
        "apps/golmok-detective/data/quiz-images/pinocchio-clouds/quiz-photo.jpg"
    )
];

export { Quiz, quizzes };
