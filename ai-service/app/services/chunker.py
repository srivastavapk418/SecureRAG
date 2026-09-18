def split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    text = text.strip()

    if not text:
        return []

    chunks: list[str] = []
    start = 0

    while start < len(text):
        end = min(len(text), start + chunk_size)

        if end < len(text):
            candidate = text[start:end]
            preferred_break = max(
                candidate.rfind("\n\n"),
                candidate.rfind("\n"),
                candidate.rfind(". "),
                candidate.rfind(" "),
            )

            if preferred_break > int(chunk_size * 0.6):
                end = start + preferred_break + 1

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(end - overlap, start + 1)

    return chunks


def build_chunks(
    sections: list[dict[str, str]], chunk_size: int, overlap: int
) -> list[dict[str, str | int]]:
    chunks: list[dict[str, str | int]] = []
    chunk_index = 0

    for section in sections:
        for part in split_text(section["text"], chunk_size, overlap):
            chunks.append(
                {
                    "chunk_index": chunk_index,
                    "section": section["section"],
                    "locator": section.get("locator", section["section"]),
                    "page_number": section.get("page_number"),
                    "text": part,
                    "snippet": part[:240],
                }
            )
            chunk_index += 1

    return chunks
