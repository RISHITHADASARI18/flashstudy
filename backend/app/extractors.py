from dataclasses import dataclass
from pathlib import Path
import fitz
from docx import Document
from pptx import Presentation

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None

@dataclass
class ExtractedUnit:
    position: int
    source_type: str
    source_number: int | None
    source_label: str
    text: str

SUPPORTED_TYPES = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".pptx": "pptx",
}

SUPPORTED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
}

def detect_material_type(filename: str, mime_type: str) -> str | None:
    extension_type = SUPPORTED_TYPES.get(Path(filename).suffix.lower())
    mime_type_value = SUPPORTED_MIME_TYPES.get(mime_type.lower())
    if extension_type and mime_type_value and extension_type != mime_type_value:
        return None
    return extension_type or mime_type_value

def extract_pdf(path: Path) -> list[ExtractedUnit]:
    units = []
    with fitz.open(path) as doc:
        for i, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                units.append(ExtractedUnit(i, "page", i + 1, f"Page {i + 1}", text))
    return units

def extract_docx(path: Path) -> list[ExtractedUnit]:
    units = []
    doc = Document(path)
    for i, paragraph in enumerate(doc.paragraphs):
        text = paragraph.text.strip()
        if text:
            units.append(ExtractedUnit(i, "paragraph", i + 1, f"Paragraph {i + 1}", text))
    return units

def extract_pptx(path: Path) -> list[ExtractedUnit]:
    units = []
    deck = Presentation(path)
    for i, slide in enumerate(deck.slides):
        parts = [shape.text.strip() for shape in slide.shapes if hasattr(shape, "text") and shape.text.strip()]
        text = "\n".join(parts).strip()
        if text:
            units.append(ExtractedUnit(i, "slide", i + 1, f"Slide {i + 1}", text))
    return units

def extract_content(path: Path, material_type: str) -> list[ExtractedUnit]:
    if material_type == "pdf":
        return extract_pdf(path)
    if material_type == "docx":
        return extract_docx(path)
    if material_type == "pptx":
        return extract_pptx(path)
    raise RuntimeError(f"Extraction for {material_type.upper()} is not available.")
