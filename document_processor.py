"""
Document Processing Module for RBI Master Circulars
Handles PDF ingestion, chunking, and category tagging
"""
import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from PyPDF2 import PdfReader

from config import settings


class DocumentProcessor:
    """Process PDF documents with category tagging and caching"""

    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )
        self.index_cache = self._load_cache()

    def _load_cache(self) -> Dict:
        """Load index cache from file"""
        if settings.INDEX_CACHE_FILE.exists():
            with open(settings.INDEX_CACHE_FILE, "r") as f:
                return json.load(f)
        return {"files": {}, "last_updated": None}

    def _save_cache(self):
        """Save index cache to file"""
        self.index_cache["last_updated"] = datetime.now().isoformat()
        with open(settings.INDEX_CACHE_FILE, "w") as f:
            json.dump(self.index_cache, f, indent=2)

    def _get_file_hash(self, file_path: Path) -> str:
        """Generate hash for file to detect changes"""
        hasher = hashlib.md5()
        with open(file_path, "rb") as f:
            buf = f.read(65536)
            while len(buf) > 0:
                hasher.update(buf)
                buf = f.read(65536)
        return hasher.hexdigest()

    def _detect_category(self, text: str, filename: str) -> str:
        """Detect document category based on content and filename"""
        text_lower = text.lower()
        filename_lower = filename.lower()
        combined = text_lower + " " + filename_lower

        # Score each category
        category_scores = {}
        for category, keywords in settings.CATEGORY_KEYWORDS.items():
            if category == "General":
                continue
            score = sum(1 for kw in keywords if kw in combined)
            if score > 0:
                category_scores[category] = score

        if category_scores:
            return max(category_scores, key=category_scores.get)
        return "General"

    def _extract_circular_info(self, text: str) -> Dict:
        """Extract circular title, number, date, and other metadata from RBI circular headers"""
        import re

        info = {
            "circular_number": None,
            "circular_title": None,  # The main title/name from the circular header
            "date": None,
            "subject": None
        }

        # Get first 3000 chars for header extraction
        header_text = text[:3000]
        lines = header_text.split("\n")

        # Patterns for RBI circular headers
        circular_patterns = [
            r"Master\s+Circular[:\s\-–]*(.+?)(?:\n|$)",
            r"Master\s+Direction[:\s\-–]*(.+?)(?:\n|$)",
            r"Consolidated\s+Circular[:\s\-–]*(.+?)(?:\n|$)",
        ]

        # Try to extract the main title
        for pattern in circular_patterns:
            match = re.search(pattern, header_text, re.IGNORECASE | re.MULTILINE)
            if match:
                title = match.group(0).strip()
                # Clean up the title
                title = re.sub(r'\s+', ' ', title)  # Normalize whitespace
                info["circular_title"] = title[:200]
                break

        # If no pattern match, try to find title from first meaningful lines
        if not info["circular_title"]:
            for line in lines[:15]:
                line = line.strip()
                # Look for lines that look like titles (capital letters, reasonable length)
                if len(line) > 20 and len(line) < 200:
                    # Check if it looks like a title (contains key words)
                    if any(kw in line.lower() for kw in ["master", "circular", "direction", "nbfc", "non-banking", "prudential", "guidelines"]):
                        info["circular_title"] = line
                        break

        # Extract circular reference number
        ref_patterns = [
            r"(RBI/\d{4}-\d{2,4}/\d+)",
            r"(DNBS[.\s]*\(PD\)[.\s]*[A-Z]+[.\s]*No[.\s]*\d+/[^/]+/\d{4}-\d{2,4})",
            r"(DOR[.\s]*\([A-Z]+\)[.\s]*[A-Z]+[.\s]*No[.\s]*\d+/[^/]+/\d{4}-\d{2,4})",
            r"Circular\s+No[.:\s]*([A-Z0-9/\-\(\)]+)",
        ]

        for pattern in ref_patterns:
            match = re.search(pattern, header_text, re.IGNORECASE)
            if match:
                info["circular_number"] = match.group(1).strip()[:100]
                break

        # Extract date
        date_patterns = [
            r"(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+\d{4})",
            r"((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})",
            r"Dated[:\s]+([^\n]+)",
        ]

        for pattern in date_patterns:
            match = re.search(pattern, header_text, re.IGNORECASE)
            if match:
                info["date"] = match.group(1).strip()[:50]
                break

        # Extract subject line
        subject_match = re.search(r"(?:Subject|Re)[:\s\-–]+(.+?)(?:\n\n|\n(?=[A-Z]))", header_text, re.IGNORECASE | re.DOTALL)
        if subject_match:
            subject = subject_match.group(1).strip()
            subject = re.sub(r'\s+', ' ', subject)  # Normalize whitespace
            info["subject"] = subject[:300]

        # If still no title, use subject as fallback
        if not info["circular_title"] and info["subject"]:
            info["circular_title"] = info["subject"]

        return info

    def extract_text_from_pdf(self, file_path: Path) -> str:
        """Extract text from PDF file"""
        try:
            reader = PdfReader(str(file_path))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
            return ""

    def _generate_summary_points(self, text: str, category: str) -> List[str]:
        """Generate brief summary bullet points for a circular"""
        import re

        summary_points = []

        # Extract key sections/topics based on common RBI circular structures
        section_patterns = [
            (r"(?:Chapter|Section|Part)\s*[\dIVX]+[:\.\s\-–]+([^\n]+)", "Covers: {}"),
            (r"(?:Applicability|Applicable\s+to)[:\s\-–]+([^\n]+)", "Applies to: {}"),
            (r"(?:Effective\s+from|Effective\s+Date)[:\s\-–]+([^\n]+)", "Effective: {}"),
            (r"(?:Supersedes|Replaces)[:\s\-–]+([^\n]+)", "Supersedes: {}"),
        ]

        for pattern, template in section_patterns:
            matches = re.findall(pattern, text[:5000], re.IGNORECASE)
            for match in matches[:2]:  # Limit to 2 per pattern
                clean_match = match.strip()[:100]
                if clean_match:
                    summary_points.append(template.format(clean_match))

        # Add category-specific points
        category_keywords = {
            "Asset Classification": ["npa", "provisioning", "standard asset", "sub-standard", "doubtful", "loss asset"],
            "Capital Adequacy": ["crar", "tier 1", "tier 2", "capital ratio", "risk weight"],
            "KYC/AML": ["customer identification", "due diligence", "suspicious transaction", "pml act"],
            "Fair Practices Code": ["loan agreement", "interest rate", "recovery", "grievance"],
            "ALM (Asset Liability Management)": ["liquidity", "maturity", "mismatch", "gap analysis"],
            "Corporate Governance": ["board", "audit committee", "independent director", "fit and proper"],
        }

        text_lower = text.lower()
        if category in category_keywords:
            found_topics = []
            for kw in category_keywords[category]:
                if kw in text_lower and kw not in str(found_topics).lower():
                    found_topics.append(kw.title())
            if found_topics:
                summary_points.append(f"Key topics: {', '.join(found_topics[:4])}")

        # Limit to 5 summary points
        return summary_points[:5] if summary_points else ["General regulatory guidelines for NBFCs"]

    def process_document(self, file_path: Path) -> List[Document]:
        """Process a single PDF document into chunks with metadata"""
        text = self.extract_text_from_pdf(file_path)
        if not text.strip():
            print(f"Warning: No text extracted from {file_path}")
            return []

        # Detect category and extract info
        category = self._detect_category(text, file_path.name)
        circular_info = self._extract_circular_info(text)

        # Generate summary points
        summary_points = self._generate_summary_points(text, category)

        # Create metadata
        metadata = {
            "source": str(file_path),
            "filename": file_path.name,
            "category": category,
            "circular_title": circular_info["circular_title"],  # The actual name from the circular
            "circular_number": circular_info["circular_number"],
            "circular_date": circular_info["date"],
            "subject": circular_info["subject"],
            "summary_points": summary_points,  # Brief bullet points
            "file_hash": self._get_file_hash(file_path)
        }

        # Split into chunks
        chunks = self.text_splitter.split_text(text)
        documents = []

        for i, chunk in enumerate(chunks):
            doc_metadata = metadata.copy()
            doc_metadata["chunk_id"] = i
            doc_metadata["total_chunks"] = len(chunks)
            documents.append(Document(page_content=chunk, metadata=doc_metadata))

        return documents

    def get_files_to_process(self) -> tuple[List[Path], List[str]]:
        """
        Identify which files need processing based on cache.
        Returns (files_to_process, files_to_remove)
        """
        current_files = {}
        pdf_files = list(settings.DOCUMENTS_DIR.glob("*.pdf"))

        for pdf_path in pdf_files:
            file_hash = self._get_file_hash(pdf_path)
            current_files[str(pdf_path)] = file_hash

        # Files to process (new or changed)
        files_to_process = []
        for file_path, file_hash in current_files.items():
            cached_hash = self.index_cache["files"].get(file_path)
            if cached_hash != file_hash:
                files_to_process.append(Path(file_path))

        # Files to remove (deleted)
        files_to_remove = []
        for cached_file in self.index_cache["files"]:
            if cached_file not in current_files:
                files_to_remove.append(cached_file)

        return files_to_process, files_to_remove

    def process_all_documents(self, force_reindex: bool = False) -> List[Document]:
        """Process all PDF documents in the directory"""
        all_documents = []
        pdf_files = list(settings.DOCUMENTS_DIR.glob("*.pdf"))

        if force_reindex:
            files_to_process = pdf_files
            print(f"Force reindexing all {len(pdf_files)} documents...")
        else:
            files_to_process, files_to_remove = self.get_files_to_process()
            if not files_to_process and not files_to_remove:
                print("No changes detected. Using cached index.")
                return []
            print(f"Processing {len(files_to_process)} new/changed documents...")

        for pdf_path in files_to_process:
            print(f"Processing: {pdf_path.name}")
            docs = self.process_document(pdf_path)
            all_documents.extend(docs)

            # Update cache
            self.index_cache["files"][str(pdf_path)] = self._get_file_hash(pdf_path)

        self._save_cache()
        print(f"Processed {len(all_documents)} chunks from {len(files_to_process)} documents")

        return all_documents

    def get_all_categories(self) -> List[str]:
        """Get list of all available categories"""
        return list(settings.CATEGORY_KEYWORDS.keys())


# Standalone function for folder monitoring
def monitor_folder_changes(callback=None):
    """Monitor document folder for changes using watchdog"""
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

    class PDFHandler(FileSystemEventHandler):
        def on_created(self, event):
            if event.src_path.endswith('.pdf'):
                print(f"New PDF detected: {event.src_path}")
                if callback:
                    callback()

        def on_modified(self, event):
            if event.src_path.endswith('.pdf'):
                print(f"PDF modified: {event.src_path}")
                if callback:
                    callback()

        def on_deleted(self, event):
            if event.src_path.endswith('.pdf'):
                print(f"PDF deleted: {event.src_path}")
                if callback:
                    callback()

    observer = Observer()
    observer.schedule(PDFHandler(), str(settings.DOCUMENTS_DIR), recursive=False)
    observer.start()
    return observer


if __name__ == "__main__":
    # Test document processing
    processor = DocumentProcessor()
    docs = processor.process_all_documents()
    print(f"\nTotal documents processed: {len(docs)}")

    if docs:
        print(f"\nSample document metadata:")
        print(json.dumps(docs[0].metadata, indent=2, default=str))
