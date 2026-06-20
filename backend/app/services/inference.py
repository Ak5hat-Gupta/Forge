from __future__ import annotations

import re
import statistics
from dataclasses import dataclass, field
from typing import Any

from dateutil import parser as dateparser


@dataclass
class ColumnInference:
    name: str
    slug: str
    position: int
    inferred_type: str = "string"
    nullable: bool = True
    confidence: float = 1.0
    enum_values: list[str] | None = None
    sample_values: list[Any] | None = None
    stats: dict[str, Any] = field(default_factory=dict)


_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
_URL_RE = re.compile(r"^https?://\S+$", re.IGNORECASE)
_CURRENCY_RE = re.compile(r"^[\$€£¥]?\s?[\d,]+\.?\d{0,2}$")
_BOOL_TRUE = {"true", "yes", "1", "y", "t"}
_BOOL_FALSE = {"false", "no", "0", "n", "f"}
_BOOL_ALL = _BOOL_TRUE | _BOOL_FALSE


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug or "column"


def _is_bool(v: str) -> bool:
    return v.strip().lower() in _BOOL_ALL


def _is_integer(v: str) -> bool:
    try:
        int(v.strip().replace(",", ""))
        return True
    except ValueError:
        return False


def _is_float(v: str) -> bool:
    try:
        float(v.strip().replace(",", ""))
        return True
    except ValueError:
        return False


def _is_currency(v: str) -> bool:
    return bool(_CURRENCY_RE.match(v.strip()))


def _is_date(v: str) -> bool:
    try:
        dateparser.parse(v.strip(), fuzzy=False)
        return True
    except (ValueError, OverflowError):
        return False


def _is_email(v: str) -> bool:
    return bool(_EMAIL_RE.match(v.strip()))


def _is_url(v: str) -> bool:
    return bool(_URL_RE.match(v.strip()))


_DETECTORS = [
    ("boolean", _is_bool),
    ("integer", _is_integer),
    ("float", _is_float),
    ("currency", _is_currency),
    ("date", _is_date),
    ("email", _is_email),
    ("url", _is_url),
]

CONFIDENCE_THRESHOLD = 0.80
ENUM_MAX_UNIQUE = 20
ENUM_RATIO_THRESHOLD = 0.05
SAMPLE_SIZE = 100


def _compute_stats(values: list[str], inferred_type: str) -> dict[str, Any]:
    stats: dict[str, Any] = {
        "total_count": len(values),
        "unique_count": len(set(values)),
    }

    if inferred_type in ("integer", "float", "currency"):
        nums = []
        for v in values:
            try:
                cleaned = v.strip().lstrip("$€£¥").replace(",", "")
                nums.append(float(cleaned))
            except ValueError:
                continue
        if nums:
            stats["min"] = min(nums)
            stats["max"] = max(nums)
            stats["mean"] = round(statistics.mean(nums), 2)
            stats["median"] = round(statistics.median(nums), 2)
            stats["sum"] = round(sum(nums), 2)

    elif inferred_type == "date":
        dates = []
        for v in values:
            try:
                dates.append(dateparser.parse(v.strip(), fuzzy=False))
            except (ValueError, OverflowError):
                continue
        if dates:
            stats["min_date"] = str(min(dates).date())
            stats["max_date"] = str(max(dates).date())

    elif inferred_type == "boolean":
        lower = [v.strip().lower() for v in values]
        stats["true_count"] = sum(1 for v in lower if v in _BOOL_TRUE)
        stats["false_count"] = sum(1 for v in lower if v in _BOOL_FALSE)

    elif inferred_type == "enum":
        from collections import Counter
        stats["distribution"] = dict(Counter(values).most_common(ENUM_MAX_UNIQUE))

    elif inferred_type in ("string", "email", "url"):
        lengths = [len(v) for v in values]
        if lengths:
            stats["avg_length"] = round(statistics.mean(lengths), 1)
            stats["max_length"] = max(lengths)

    return stats


def infer_column(name: str, position: int, values: list[str | None]) -> ColumnInference:
    slug = _slugify(name)
    non_null = [v.strip() for v in values if v is not None and v.strip() != ""]
    has_nulls = len(non_null) < len(values)

    if not non_null:
        return ColumnInference(
            name=name, slug=slug, position=position,
            inferred_type="string", nullable=True, confidence=0.0,
            sample_values=[], stats={"total_count": 0, "unique_count": 0},
        )

    sample = non_null[:SAMPLE_SIZE]

    for type_name, detector in _DETECTORS:
        matches = sum(1 for v in sample if detector(v))
        confidence = matches / len(sample)
        if confidence >= CONFIDENCE_THRESHOLD:
            full_matches = sum(1 for v in non_null if detector(v))
            full_confidence = full_matches / len(non_null)
            if full_confidence >= CONFIDENCE_THRESHOLD:
                return ColumnInference(
                    name=name, slug=slug, position=position,
                    inferred_type=type_name, nullable=has_nulls,
                    confidence=round(full_confidence, 3),
                    sample_values=non_null[:5],
                    stats=_compute_stats(non_null, type_name),
                )

    unique = set(non_null)
    if len(unique) <= ENUM_MAX_UNIQUE and len(non_null) >= 20:
        ratio = len(unique) / len(non_null)
        if ratio <= ENUM_RATIO_THRESHOLD or (len(unique) <= 10 and ratio <= 0.5):
            return ColumnInference(
                name=name, slug=slug, position=position,
                inferred_type="enum", nullable=has_nulls,
                confidence=1.0,
                enum_values=sorted(unique),
                sample_values=non_null[:5],
                stats=_compute_stats(non_null, "enum"),
            )

    return ColumnInference(
        name=name, slug=slug, position=position,
        inferred_type="string", nullable=has_nulls, confidence=1.0,
        sample_values=non_null[:5],
        stats=_compute_stats(non_null, "string"),
    )


def infer_schema(headers: list[str], data: list[list[str | None]]) -> list[ColumnInference]:
    results = []
    for i, header in enumerate(headers):
        col_values = [row[i] if i < len(row) else None for row in data]
        results.append(infer_column(header, i, col_values))
    return results
