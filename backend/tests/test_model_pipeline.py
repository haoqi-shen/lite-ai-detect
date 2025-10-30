import numpy as np

from app.models.features import extract_features
from app.models import onnx_runner


def test_extract_features_shape_and_values():
    text = "This is a simple sentence. It tests feature extraction! 123"
    feats, summary = extract_features(text)
    assert feats.shape == (1, 10)
    # sanity checks: ratios within [0,1]
    assert 0.0 <= summary["ttr"] <= 1.0
    assert 0.0 <= summary["punct_ratio"] <= 1.0
    assert 0.0 <= summary["stop_ratio"] <= 1.0


def test_infer_with_mock(monkeypatch):
    # Mock onnx session by overriding infer to be deterministic
    def fake_infer(features: np.ndarray) -> float:
        m = float(np.clip(features.mean(), 0.0, 1.0))
        return m

    monkeypatch.setattr(onnx_runner, "infer", fake_infer)
    feats, _ = extract_features("Short text for testing.")
    prob = onnx_runner.infer(feats)
    assert 0.0 <= prob <= 1.0


