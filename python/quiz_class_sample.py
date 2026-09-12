class Quiz:
    def __init__(self, part_photo, hint_photo, quiz_text, choices, correct_answer_index, answer_explanation, answer_image, geo_coordinates):
        self.part_photo = part_photo
        self.hint_photo = hint_photo
        self.quiz_text = quiz_text
        self.choices = choices
        self.correct_answer_index = correct_answer_index
        self.answer_explanation = answer_explanation
        self.answer_image = answer_image
        self.geo_coordinates = geo_coordinates

    def to_json(self):
        return {
            "part_photo": self.part_photo,
            "hint_photo": self.hint_photo,
            "quiz_text": self.quiz_text,
            "choices": self.choices,
            "correct_answer_index": self.correct_answer_index,
            "answer_explanation": self.answer_explanation,
            "answer_image": self.answer_image,
            "geo_coordinates": self.geo_coordinates
        }

quiz_instance = Quiz(
    part_photo="/Users/quokkaman/.openclaw/workspace/media/inbound/openclaw-staged-0e3a9150-1284-4899-b8c5-ad580e8b5426/input-41e5b8bf-032e-4799-8531-61b767150242.jpg",
    hint_photo="/Users/quokkaman/.openclaw/workspace/media/inbound/openclaw-staged-39a0db48-d8f3-44af-b75a-3bc446661660/input-80049834-981b-4b50-8fe7-a25354b2ba8b.jpg",
    quiz_text="다음 사진 속 황금빛 패루(牌樓)에 가려진 한자 현판에 적힌 글자는 무엇일까요?",
    choices=["1. 仁華門", "2. 中華門", "3. 華僑門", "4. 仁川門"],
    correct_answer_index=1,
    answer_explanation="인천 차이나타운 입구에 세워진 패루 중 하나로, '어질고 화목하다'는 뜻을 담은 이름입니다.",
    answer_image="/Users/quokkaman/.openclaw/workspace/media/inbound/openclaw-staged-56977528-bc9b-46da-8a44-0c7da21b68ec/input-89aa2e92-734f-4b14-8dc7-af4dc7a84e60.jpg",
    geo_coordinates={"latitude": 37.473045, "longitude": 126.6188592}
)

json_data = quiz_instance.to_json()
print(json_data)
