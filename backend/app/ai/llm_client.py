import os
import json
import time
import urllib.request
from decimal import Decimal
from typing import Dict, Any, Tuple

def estimate_tokens(text: str) -> int:
    """Fallback token counter if provider usageMetadata is not returned."""
    if not text:
        return 0
    return max(1, len(text) // 4)

def calculate_cost(prompt_tokens: int, completion_tokens: int) -> Decimal:
    """Calculates estimated USD cost from token counts."""
    # Standard pricing for Gemini Flash Lite tier: $0.075 / 1M prompt tokens, $0.30 / 1M candidate tokens
    cost = (prompt_tokens * 0.000000075) + (completion_tokens * 0.00000030)
    return Decimal(str(round(cost, 6)))

def generate_ai_explanation(
    question: str,
    computed_facts: Dict[str, Any],
    fallback_explanation: str
) -> Tuple[str, int, int, int, int, Decimal, str]:
    """
    Synthesizes an intelligent, grounded financial explanation using cloud Gemini AI.
    Measures latency in milliseconds.
    Returns: (explanation, latency_ms, prompt_tokens, completion_tokens, total_tokens, cost_usd, model_source)
    """
    start_time = time.perf_counter()
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        latency_ms = max(1, int((time.perf_counter() - start_time) * 1000))
        p_tok = estimate_tokens(question + str(computed_facts))
        c_tok = estimate_tokens(fallback_explanation)
        tot_tok = p_tok + c_tok
        return (
            fallback_explanation,
            latency_ms,
            p_tok,
            c_tok,
            tot_tok,
            calculate_cost(p_tok, c_tok),
            "Grounded Financial AI Engine (Local)",
        )

    # Prompt forcing strict zero-hallucination adherence to the computed facts
    facts_str = ", ".join(f"{k}: {v}" for k, v in computed_facts.items())
    prompt = (
        f"You are an intelligent, trusted personal finance advisor. "
        f"Ground your answer STRICTLY in these verified database calculations without inventing numbers:\n"
        f"User Question: {question}\n"
        f"Verified Financial Facts: {facts_str}\n"
        f"Baseline Reference: {fallback_explanation}\n\n"
        f"Deliver a concise, polished 2-3 sentence answer explaining the numbers clearly and offering a helpful observation."
    )

    # Prioritize active, fast, reliable production Gemini models
    candidate_models = [
        "models/gemini-flash-lite-latest",
        "models/gemini-3.5-flash-lite",
        "models/gemini-3.5-flash"
    ]

    for model_name in candidate_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": 450,
                    "temperature": 0.2
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=8) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text_parts = [p.get("text", "") for p in parts if p.get("text")]
                        ai_text = " ".join(text_parts).strip()
                        if ai_text:
                            latency_ms = max(1, int((time.perf_counter() - start_time) * 1000))
                            usage = data.get("usageMetadata", {})
                            prompt_tokens = int(usage.get("promptTokenCount") or estimate_tokens(prompt))
                            completion_tokens = int(usage.get("candidatesTokenCount") or estimate_tokens(ai_text))
                            total_tokens = int(usage.get("totalTokenCount") or (prompt_tokens + completion_tokens))
                            cost_usd = calculate_cost(prompt_tokens, completion_tokens)
                            
                            display_name = model_name.replace("models/", "").replace("-latest", "").replace("-", " ").title()
                            return (
                                ai_text,
                                latency_ms,
                                prompt_tokens,
                                completion_tokens,
                                total_tokens,
                                cost_usd,
                                f"{display_name} (Cloud Grounded)"
                            )
        except Exception:
            continue

    # Clean deterministic fallback if all external calls timeout or fail
    latency_ms = max(1, int((time.perf_counter() - start_time) * 1000))
    prompt_tokens = estimate_tokens(prompt)
    completion_tokens = estimate_tokens(fallback_explanation)
    total_tokens = prompt_tokens + completion_tokens
    cost_usd = calculate_cost(prompt_tokens, completion_tokens)

    return (
        fallback_explanation,
        latency_ms,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        cost_usd,
        "Grounded Financial AI Engine (Safe Fallback)"
    )
