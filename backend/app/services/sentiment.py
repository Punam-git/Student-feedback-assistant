import re
import json
from typing import Dict, Any, List, Tuple
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize VADER analyzer singleton
_vader_analyzer = SentimentIntensityAnalyzer()

# Hinglish keyword adjustments for educational domain
HINGLISH_LEXICON = {
    # Positive
    "badhiya": 2.5,
    "achha": 2.0,
    "achhi": 2.0,
    "bohot achha": 3.0,
    "bahut achha": 3.0,
    "shandaar": 3.0,
    "mast": 2.5,
    "samajh aa gaya": 2.5,
    "clear ho gaya": 2.5,
    "maza aa gaya": 2.8,
    "best teacher": 3.0,
    "helpful hain": 2.2,
    "supportive": 2.4,
    # Negative
    "bekar": -2.8,
    "bakwas": -3.2,
    "samajh nahi aaya": -2.5,
    "kuch samajh nahi aata": -3.0,
    "boring": -2.2,
    "slow padhate hain": -1.8,
    "bohot fast": -1.5,
    "bahut fast": -1.5,
    "doubt clear nahi hota": -2.6,
    "timepass": -2.5,
    "koi fayda nahi": -2.7,
    "lab me kuch nahi sikhaya": -2.9,
    "notes bekar hain": -2.4,
    "confusing": -2.0,
    # Neutral / Mixed
    "theek thaak": 0.1,
    "thik thak": 0.1,
    "average": 0.0,
    "chalega": 0.2,
    "kabhi achha kabhi boring": 0.0,
}

# Add Hinglish words to VADER's internal lexicon
for word, score in HINGLISH_LEXICON.items():
    _vader_analyzer.lexicon[word.lower()] = score

# Theme detection dictionary for educational domain
THEME_PATTERNS = {
    "teaching_clarity": [
        r"explain", r"explanation", r"clarity", r"clear", r"concept", r"confus", r"understand",
        r"samajh", r"doubt", r"teaching", r"pedagogy", r"board", r"voice", r"audio"
    ],
    "practical_sessions": [
        r"lab", r"practical", r"hands-on", r"experiment", r"code", r"coding", r"hardware",
        r"simulation", r"system", r"computer"
    ],
    "course_content": [
        r"syllabus", r"curriculum", r"content", r"topics", r"depth", r"advanced", r"basics",
        r"theory", r"notes", r"material", r"slides", r"textbook"
    ],
    "pace_and_workload": [
        r"pace", r"fast", r"slow", r"speed", r"rushed", r"time", r"workload", r"assignment",
        r"homework", r"deadline", r"submission", r"project"
    ],
    "classroom_environment": [
        r"interactive", r"engagement", r"boring", r"attentive", r"discipline", r"friendly",
        r"supportive", r"strict", r"encourage", r"question"
    ],
    "exams_and_evaluation": [
        r"exam", r"test", r"quiz", r"marks", r"grade", r"grading", r"evaluation", r"cie",
        r"assessment"
    ]
}


class SentimentEngine:
    def __init__(self):
        self.model_name = "VADER Rule-Based (Enhanced with Hinglish Lexicon)"

    def extract_themes(self, text: str) -> List[str]:
        """Identify academic thematic tags mentioned in the written feedback."""
        if not text:
            return []
        
        lowered = text.lower()
        extracted = []
        for theme, patterns in THEME_PATTERNS.items():
            for pat in patterns:
                if re.search(r"\b" + pat, lowered):
                    extracted.append(theme)
                    break
        return extracted

    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze feedback text and return classification, confidence, method, and themes.
        Uses VADER compound score with boundary thresholds.
        """
        if not text or not text.strip():
            return {
                "sentiment": "Neutral",
                "confidence": 0.50,
                "model_name": self.model_name,
                "themes": "[]",
                "scores": {"pos": 0.0, "neu": 1.0, "neg": 0.0, "compound": 0.0}
            }

        clean_text = text.strip()
        scores = _vader_analyzer.polarity_scores(clean_text)
        compound = scores["compound"]
        pos = scores["pos"]
        neg = scores["neg"]

        # Classification logic
        # If both strong positive and negative elements exist, classify as Mixed
        if pos >= 0.15 and neg >= 0.15 and -0.35 <= compound <= 0.35:
            sentiment = "Mixed"
            confidence = round(float(pos + neg) / 2.0 + 0.3, 2)
        elif compound >= 0.15:
            sentiment = "Positive"
            # Map compound (0.15 to 1.0) to confidence (0.55 to 0.98)
            confidence = round(0.55 + (compound - 0.15) * (0.43 / 0.85), 2)
        elif compound <= -0.15:
            sentiment = "Negative"
            # Map compound (-0.15 to -1.0) to confidence (0.55 to 0.98)
            confidence = round(0.55 + (abs(compound) - 0.15) * (0.43 / 0.85), 2)
        else:
            sentiment = "Neutral"
            confidence = round(float(scores["neu"]), 2)

        confidence = max(0.40, min(0.99, confidence))
        themes = self.extract_themes(clean_text)

        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "model_name": self.model_name,
            "themes": json.dumps(themes),
            "scores": scores
        }


# Singleton engine instance
sentiment_engine = SentimentEngine()
