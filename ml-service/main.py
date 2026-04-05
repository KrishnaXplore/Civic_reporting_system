import os
import json
import math
import logging
import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CivicConnect ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN             = os.getenv("HF_TOKEN", "")
IMAGE_MODEL          = "Ateeqq/ai-vs-human-image-detector"
TEXT_MODEL           = "sentence-transformers/all-MiniLM-L6-v2"
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.70"))

HF_HEADERS = {
    "Authorization": f"Bearer {HF_TOKEN}",
}


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "hf_token_set": bool(HF_TOKEN),
        "image_model": IMAGE_MODEL,
        "text_model": TEXT_MODEL,
        "mode": "batched_similarity",
    }


# ── AI Image Detection ────────────────────────────────────────────────────────

@app.post("/check-fake")
async def check_fake(file: UploadFile = File(...)):
    """
    Checks whether an uploaded image is AI-generated or real.
    Uses Hugging Face: Ateeqq/ai-vs-human-image-detector

    Returns:
        isFake (bool)
        status (str): REJECTED | VALID | SKIPPED | ERROR
        confidence (float)
        scores (dict): { artificial, human }
    """
    try:
        image_data = await file.read()

        if not HF_TOKEN:
            logger.warning("HF_TOKEN not set — skipping AI image check")
            return {
                "isFake": False,
                "status": "SKIPPED",
                "reason": "HF_TOKEN not configured",
            }

        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{IMAGE_MODEL}",
                headers={
                    **HF_HEADERS,
                    "Content-Type": "application/octet-stream",
                },
                content=image_data,
            )

        if response.status_code == 503:
            logger.warning("HF image model loading — skipping check")
            return {"isFake": False, "status": "SKIPPED", "reason": "Model loading"}

        if response.status_code != 200:
            logger.error(f"HF API error: {response.status_code} {response.text}")
            return {"isFake": False, "status": "ERROR", "reason": f"HF API {response.status_code}"}

        result = response.json()
        logger.info(f"AI detection raw result: {result}")

        artificial = next((r["score"] for r in result if r["label"] == "artificial"), 0)
        human      = next((r["score"] for r in result if r["label"] == "human"), 0)
        is_fake    = artificial > human

        return {
            "isFake": is_fake,
            "status": "REJECTED" if is_fake else "VALID",
            "reason": "AI-generated image detected" if is_fake else "Image appears real",
            "confidence": round(artificial if is_fake else human, 4),
            "scores": {
                "artificial": round(artificial, 4),
                "human":      round(human, 4),
            },
        }

    except httpx.TimeoutException:
        logger.error("HF image request timed out")
        return {"isFake": False, "status": "ERROR", "reason": "Request timed out"}

    except Exception as e:
        logger.error(f"check-fake error: {e}")
        # Fail open — allow image through if API errors
        return {"isFake": False, "status": "ERROR", "reason": str(e)}


# ── Batched Text Similarity ───────────────────────────────────────────────────

async def get_batch_similarity(source: str, candidates: list[str]) -> list[float]:
    """
    Calls HF sentence-transformers with ONE batched request.
    Compares source against ALL candidate sentences at once.

    Instead of:
        call(source, candidate1) → 3s
        call(source, candidate2) → 3s
        call(source, candidate3) → 3s
        Total: 9s

    We do:
        call(source, [candidate1, candidate2, candidate3]) → 3-4s
        Total: 3-4s regardless of number of candidates

    Returns a list of similarity scores in the same order as candidates.
    """
    try:
        if not HF_TOKEN or not candidates:
            return [0.0] * len(candidates)

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{TEXT_MODEL}",
                headers={**HF_HEADERS, "Content-Type": "application/json"},
                json={
                    "inputs": {
                        "source_sentence": source,
                        "sentences": candidates,   # all candidates in one shot
                    }
                },
            )

        if response.status_code == 503:
            logger.warning("HF text model loading — returning zero scores")
            return [0.0] * len(candidates)

        if response.status_code != 200:
            logger.error(f"HF text API error: {response.status_code} {response.text}")
            return [0.0] * len(candidates)

        scores = response.json()
        logger.info(f"Batch similarity scores: {scores}")

        # HF returns a list of floats in same order as input sentences
        if isinstance(scores, list):
            return [float(s) for s in scores]

        return [0.0] * len(candidates)

    except httpx.TimeoutException:
        logger.error("HF text similarity request timed out")
        return [0.0] * len(candidates)

    except Exception as e:
        logger.error(f"get_batch_similarity error: {e}")
        return [0.0] * len(candidates)


# ── Duplicate Detection ───────────────────────────────────────────────────────

@app.post("/check-duplicate")
async def check_duplicate(
    description: str = Query(...),
    title: str = Query(...),
    lat: float = Query(...),
    lng: float = Query(...),
    nearby_complaints: str = Query(None),
):
    """
    Checks whether a new complaint is a duplicate of existing nearby ones.

    Receives nearby complaints already pre-filtered by Express/MongoDB:
    - Same category
    - Within location radius
    - Within time window
    - Status not Resolved/Rejected

    Uses ONE batched HF API call to compare the new complaint against
    ALL nearby complaints simultaneously — much faster than sequential calls.

    nearby_complaints: JSON string of:
    [{_id, title, description, location: {coordinates: [lng, lat]}}]

    Returns:
        isDuplicate (bool)
        duplicateId (str | None): _id of the matched complaint
        similarity (float): highest similarity score found
        allScores (list): scores for all candidates (for debugging)
        status (str): DUPLICATE | UNIQUE | SKIPPED | ERROR
    """
    try:
        if not nearby_complaints:
            return {
                "isDuplicate": False,
                "duplicateId": None,
                "similarity": 0.0,
                "allScores": [],
                "status": "UNIQUE",
            }

        complaints = json.loads(nearby_complaints)

        if not complaints:
            return {
                "isDuplicate": False,
                "duplicateId": None,
                "similarity": 0.0,
                "allScores": [],
                "status": "UNIQUE",
            }

        if not HF_TOKEN:
            logger.warning("HF_TOKEN not set — skipping duplicate check")
            return {
                "isDuplicate": False,
                "duplicateId": None,
                "similarity": 0.0,
                "allScores": [],
                "status": "SKIPPED",
            }

        # Combine title + description for richer semantic comparison
        new_text = f"{title}. {description}".strip()

        # Build candidate texts — one string per nearby complaint
        candidate_texts = [
            f"{c.get('title', '')}. {c.get('description', '')}".strip()
            for c in complaints
        ]

        logger.info(f"Running batched similarity: 1 source vs {len(candidate_texts)} candidates")

        # ONE API call for all candidates
        scores = await get_batch_similarity(new_text, candidate_texts)

        logger.info(f"Scores: { {complaints[i]['_id']: round(scores[i], 3) for i in range(len(scores))} }")

        # Find the best match
        best_index = scores.index(max(scores)) if scores else -1
        best_score = scores[best_index] if best_index >= 0 else 0.0
        best_id    = complaints[best_index]["_id"] if best_index >= 0 else None

        if best_score >= SIMILARITY_THRESHOLD:
            logger.info(f"Duplicate found: {best_id} with similarity {best_score:.3f}")
            return {
                "isDuplicate": True,
                "duplicateId": best_id,
                "similarity":  round(best_score, 4),
                "allScores":   [
                    {"_id": complaints[i]["_id"], "score": round(scores[i], 4)}
                    for i in range(len(scores))
                ],
                "status": "DUPLICATE",
            }

        return {
            "isDuplicate": False,
            "duplicateId": None,
            "similarity":  round(best_score, 4),
            "allScores":   [
                {"_id": complaints[i]["_id"], "score": round(scores[i], 4)}
                for i in range(len(scores))
            ],
            "status": "UNIQUE",
        }

    except json.JSONDecodeError as e:
        logger.error(f"Invalid nearby_complaints JSON: {e}")
        return {"isDuplicate": False, "duplicateId": None, "similarity": 0.0, "allScores": [], "status": "ERROR"}

    except Exception as e:
        logger.error(f"check-duplicate error: {e}")
        # Fail open — complaint stays active if duplicate check crashes
        return {"isDuplicate": False, "duplicateId": None, "similarity": 0.0, "allScores": [], "status": "ERROR"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
