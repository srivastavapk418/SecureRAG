from pathlib import Path

from docx import Document as WordDocument
from pypdf import PdfReader

from app.utils.text import normalize_text


def _parse_pdf(file_path: Path) -> list[dict[str, str]]:
    reader = PdfReader(str(file_path))
    sections: list[dict[str, str | int]] = []

    for index, page in enumerate(reader.pages, start=1):
        text = normalize_text(page.extract_text() or "")

        if text:
            sections.append(
                {
                    "section": f"Page {index}",
                    "locator": f"Page {index}",
                    "page_number": index,
                    "text": text,
                }
            )

    return sections


def _parse_docx(file_path: Path) -> list[dict[str, str]]:
    document = WordDocument(str(file_path))
    sections: list[dict[str, str]] = []
    current_heading = "Document"
    buffer: list[str] = []

    for paragraph in document.paragraphs:
        text = normalize_text(paragraph.text)

        if not text:
            continue

        style_name = normalize_text(getattr(paragraph.style, "name", "")).lower()

        if style_name.startswith("heading"):
            if buffer:
                sections.append(
                    {
                        "section": current_heading,
                        "locator": f"Section: {current_heading}",
                        "text": " ".join(buffer),
                    }
                )
                buffer = []

            current_heading = text
            continue

        buffer.append(text)

    if buffer:
        sections.append(
            {
                "section": current_heading,
                "locator": f"Section: {current_heading}",
                "text": " ".join(buffer),
            }
        )

    return sections


def _parse_txt(file_path: Path) -> list[dict[str, str]]:
    text = normalize_text(file_path.read_text(encoding="utf-8", errors="ignore"))
    if not text:
        return []

    line_count = max(1, len([line for line in text.splitlines() if line.strip()]))
    locator = "Line 1" if line_count == 1 else f"Lines 1-{line_count}"

    return [{"section": "Text File", "locator": locator, "text": text}]


def parse_document(file_path: str) -> list[dict[str, str]]:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _parse_pdf(path)

    if suffix == ".docx":
        return _parse_docx(path)

    if suffix == ".txt":
        return _parse_txt(path)

    raise ValueError(f"Unsupported file type: {suffix}")
