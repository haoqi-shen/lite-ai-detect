def decide(prob: float, t: float = 0.65) -> str:
    return "AI" if prob >= t else "HUMAN"


