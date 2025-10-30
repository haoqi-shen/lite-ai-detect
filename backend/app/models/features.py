from __future__ import annotations

import math
import re
from statistics import mean, pstdev
from typing import List, Tuple

import numpy as np


_WORD_RE = re.compile(r"[A-Za-z']+")
_SENT_RE = re.compile(r"[^.!?]+[.!?]?")
_PUNCT_RE = re.compile(r"[\.,;:!\?\-\(\)\[\]\{\}\"']")

_STOPWORDS = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "then",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "as",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "it",
    "this",
    "that",
    "at",
    "from",
}


def _tokenize(text: str) -> List[str]:
    return [m.group(0).lower() for m in _WORD_RE.finditer(text)]


def _sentences(text: str) -> List[str]:
    sents = [s.strip() for s in _SENT_RE.findall(text) if s and s.strip()]
    return sents or [text.strip()] if text.strip() else []


def _ngrams(tokens: List[str], n: int) -> List[Tuple[str, ...]]:
    return [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def extract_features(text: str) -> Tuple[np.ndarray, dict]:
    tokens = _tokenize(text)
    token_count = len(tokens)
    unique_tokens = len(set(tokens)) if tokens else 0

    avg_word_len = float(sum(len(t) for t in tokens) / token_count) if token_count else 0.0
    type_token_ratio = float(unique_tokens / token_count) if token_count else 0.0

    punct_count = len(_PUNCT_RE.findall(text))
    char_count = len(text) or 1
    punct_ratio = float(punct_count / char_count)

    stop_count = sum(1 for t in tokens if t in _STOPWORDS)
    stop_ratio = float(stop_count / token_count) if token_count else 0.0

    # Sentence stats
    sents = _sentences(text)
    sent_lens = [len(_tokenize(s)) for s in sents] or [0]
    mean_sent_len = float(mean(sent_lens))
    std_sent_len = float(pstdev(sent_lens)) if len(sent_lens) > 1 else 0.0

    # n-gram sparsity (unique ngrams / total ngrams) for bi/tri
    def sparsity(n: int) -> float:
        ngrams = _ngrams(tokens, n)
        total = len(ngrams)
        return float(len(set(ngrams)) / total) if total else 0.0

    bigram_sparsity = sparsity(2)
    trigram_sparsity = sparsity(3)

    # case ratio: proportion of capitalized tokens
    caps = sum(1 for t in tokens if t[:1].isupper())
    caps_ratio = float(caps / token_count) if token_count else 0.0

    # digits ratio: tokens that are numeric
    digit_tokens = sum(1 for t in tokens if t.isdigit())
    digit_ratio = float(digit_tokens / token_count) if token_count else 0.0

    vect = np.array(
        [
            avg_word_len,
            type_token_ratio,
            punct_ratio,
            stop_ratio,
            mean_sent_len,
            std_sent_len,
            bigram_sparsity,
            trigram_sparsity,
            caps_ratio,
            digit_ratio,
        ],
        dtype=np.float32,
    ).reshape(1, -1)

    summary = {
        "avg_word_len": round(avg_word_len, 4),
        "ttr": round(type_token_ratio, 4),
        "punct_ratio": round(punct_ratio, 4),
        "stop_ratio": round(stop_ratio, 4),
        "mean_sent_len": round(mean_sent_len, 4),
        "std_sent_len": round(std_sent_len, 4),
        "bigram_sparsity": round(bigram_sparsity, 4),
        "trigram_sparsity": round(trigram_sparsity, 4),
        "caps_ratio": round(caps_ratio, 4),
        "digit_ratio": round(digit_ratio, 4),
    }

    return vect, summary


