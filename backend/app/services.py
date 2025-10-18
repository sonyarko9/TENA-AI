import os
import openai

openai.api_type = "azure"
openai.api_key = os.getenv("AZURE_OPENAI_KEY")
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_version = "2023-07-01-preview"

def ask_azure_openai(prompt: str) -> str:
    try:
        response = openai.Completion.create(
            engine=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
            prompt=prompt,
            max_tokens=150
        )
        return response.choices[0].text.strip()
    except Exception as e:
        return f"Error: {str(e)}"
