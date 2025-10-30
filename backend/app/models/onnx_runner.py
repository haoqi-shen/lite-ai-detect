from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

import numpy as np

try:
    import onnxruntime as ort  # type: ignore
except Exception:  # pragma: no cover - fallback in environments without onnxruntime
    ort = None  # type: ignore


@lru_cache(maxsize=1)
def _get_session() -> Optional["ort.InferenceSession"]:
    model_path = os.getenv("MODEL_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "cnn.onnx")))
    if ort is None or not os.path.exists(model_path):
        return None
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])  # type: ignore
    return sess


def infer(features: np.ndarray) -> float:
    sess = _get_session()
    if sess is None:
        # Deterministic lightweight fallback: logistic of feature mean
        x = float(np.clip(features.mean(), 0.0, 10.0))
        prob = 1.0 / (1.0 + np.exp(-x + 2.0))
        return float(np.clip(prob, 0.0, 1.0))

    input_name = sess.get_inputs()[0].name
    output_name = sess.get_outputs()[0].name
    out = sess.run([output_name], {input_name: features.astype(np.float32)})[0]
    # assume output is probability shape (N, 1) or (N,)
    prob = float(out.reshape(-1)[0])
    return float(np.clip(prob, 0.0, 1.0))


