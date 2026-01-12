import json
import os
from pathlib import Path
from document_processor import DocumentProcessor
from config import settings

def export_data():
    processor = DocumentProcessor()
    
    # Ensure raw documents directory exists
    if not os.path.exists(settings.DOCUMENTS_DIR):
        print(f"Error: Directory {settings.DOCUMENTS_DIR} not found.")
        return

    print(f"Scanning {settings.DOCUMENTS_DIR} for PDFs...")
    pdf_files = [f for f in os.listdir(settings.DOCUMENTS_DIR) if f.lower().endswith('.pdf')]
    
    all_chunks = []
    
    for filename in pdf_files:
        path = os.path.join(settings.DOCUMENTS_DIR, filename)
        print(f"Processing {filename}...")
        try:
            # Process PDF to get chunks (Correct method name)
            # process_document returns a list of LangChain Document objects
            chunks = processor.process_document(Path(path))
            
            # Simplify chunk data for mobile app (reduce size)
            for chunk in chunks:
                simple_chunk = {
                    "id": f"{filename}_{chunk.metadata.get('chunk_id')}",
                    "text": chunk.page_content,
                    "filename": chunk.metadata.get("filename"),
                    "circular_title": chunk.metadata.get("circular_title"),
                    "category": chunk.metadata.get("category"),
                    "chunk_id": chunk.metadata.get("chunk_id")
                }
                all_chunks.append(simple_chunk)
                
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

    # Output path
    output_dir = "rbi-circulars-app/src/data"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "circulars.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2)
        
    print(f"Successfully exported {len(all_chunks)} chunks to {output_file}")

if __name__ == "__main__":
    export_data()
