import re


def normalize_text(value: str) -> str:
    if not value:
        return ""
    # Normalize CRLF / CR to standard LF
    text = value.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse horizontal spaces and tabs
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse excess empty lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

