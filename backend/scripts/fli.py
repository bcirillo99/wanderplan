import subprocess
import json
import time
import requests
from openai import OpenAI

client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

TOOLS = [{
    "type": "function",
    "function": {
        "name": "search_flights",
        "description": "Search for flights between two airports on a given date",
        "parameters": {
            "type": "object",
            "required": ["origin", "destination", "date"],
            "properties": {
                "origin":      {"type": "string", "description": "IATA code e.g. MXP"},
                "destination": {"type": "string", "description": "IATA code e.g. PEK"},
                "date":        {"type": "string", "description": "YYYY-MM-DD"},
            }
        }
    }
}]

def ollama_memory_mb() -> float:
    """Chiede a Ollama quanta VRAM/RAM usa il modello caricato."""
    try:
        r = requests.get("http://localhost:11434/api/ps", timeout=2)
        models = r.json().get("models", [])
        if models:
            return models[0].get("size_vram", 0) / 1024 / 1024
    except Exception:
        pass
    return 0.0

def run_fli(origin: str, destination: str, date: str) -> str:
    result = subprocess.run(
        ["fli", "flights", origin, destination, date],
        capture_output=True, text=True
    )
    return result.stdout or result.stderr

def chat(user_message: str):
    t_total = time.time()
    messages = [{"role": "user", "content": user_message}]

    # Step 1: intent + entity extraction
    print("\n[Step 1] Modello estrae intent...")
    t1 = time.time()
    response = client.chat.completions.create(
        model="qwen3.5:4b",
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
        extra_body={"think": False},
    )
    print(f"         → {time.time() - t1:.1f}s")

    msg = response.choices[0].message

    if not msg.tool_calls:
        print("Risposta diretta:", msg.content)
        print(f"\nTempo totale: {time.time() - t_total:.1f}s")
        return

    call = msg.tool_calls[0]
    args = json.loads(call.function.arguments)
    print(f"         → chiama: {call.function.name}({args})")

    # Step 2: esegui fli
    print("\n[Step 2] Eseguo fli...")
    t2 = time.time()
    fli_output = run_fli(args["origin"], args["destination"], args["date"])
    print(f"         → {time.time() - t2:.1f}s | {len(fli_output)} chars output")

    # Step 3: risposta finale
    print("\n[Step 3] Modello genera risposta...")
    messages += [
        {"role": "assistant", "content": "", "tool_calls": [{
            "id": call.id,
            "type": "function",
            "function": {"name": call.function.name, "arguments": json.dumps(args)}
        }]},
        {"role": "tool", "tool_call_id": call.id, "content": fli_output}
    ]

    t3 = time.time()
    final = client.chat.completions.create(
        model="qwen3.5:4b",
        messages=messages,
        extra_body={"think": False},
    )
    print(f"         → {time.time() - t3:.1f}s")

    print(f"\n{'='*60}")
    print(final.choices[0].message.content)
    print(f"{'='*60}")
    print(f"\nTempo totale : {time.time() - t_total:.1f}s")
    print(f"RAM Ollama   : {ollama_memory_mb():.0f} MB")

chat("Cercami voli da Milano Malpensa a Pechino per il 10 ottobre 2026")
