import posthog
import os
from dotenv import load_dotenv

load_dotenv()

# We set up PostHog telemetry without collecting raw prompts
posthog.api_key = os.getenv("POSTHOG_API_KEY", "dummy_key_for_dev")
posthog.host = os.getenv("POSTHOG_HOST", "https://app.posthog.com")

def capture_request(
    user_id: str,
    event: str = "llm_request",
    properties: dict = None
):
    if properties is None:
        properties = {}
        
    posthog.capture(
        distinct_id=user_id,
        event=event,
        properties=properties
    )

def capture_error(user_id: str, error: str, context: dict = None):
    if context is None:
        context = {}
        
    posthog.capture(
        distinct_id=user_id,
        event="llm_request_error",
        properties={"error": error, **context}
    )
