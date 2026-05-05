import pickle
import numpy as np
from core.feature_extractor import get_feature_vector

CLASSIFIER = None
REGRESSOR  = None
CONFIDENCE_THRESHOLD = 0.60
TIER_NAMES = {0: "weak", 1: "mid", 2: "strong"}

def load_models():
    # Called once at startup
    global CLASSIFIER, REGRESSOR
    with open("core/models/router_classifier.pkl", "rb") as f:
        CLASSIFIER = pickle.load(f)
    with open("core/models/router_regressor.pkl", "rb") as f:
        REGRESSOR = pickle.load(f)

def route_prompt(prompt: str) -> dict:
    features = get_feature_vector(prompt)
    
    # predict_proba expects 2D array, returns 2D array
    probs = CLASSIFIER.predict_proba([features])[0]
    tier = int(np.argmax(probs))
    confidence = float(probs[tier])
    
    # expect 2D array, returns 1D array
    difficulty = float(REGRESSOR.predict([features])[0])

    upgraded = False
    if confidence < CONFIDENCE_THRESHOLD and tier < 2:
        tier += 1
        upgraded = True

    return {
        "tier"            : tier,
        "tier_name"       : TIER_NAMES[tier],
        "confidence"      : round(confidence, 4),
        "difficulty_score": round(difficulty, 4),
        "upgraded"        : upgraded,
    }
