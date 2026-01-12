"""Test embedding model loading"""
print("Testing sentence-transformers model loading...")
print("This may take a few minutes on first run (downloading ~90MB model)")

try:
    from sentence_transformers import SentenceTransformer
    print("Importing SentenceTransformer... done")

    print("Loading all-MiniLM-L6-v2 model...")
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("Model loaded successfully!")

    # Test embedding
    test_text = "Test embedding"
    embedding = model.encode([test_text])
    print(f"Test embedding shape: {embedding.shape}")
    print("SUCCESS: Model is working!")

except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
