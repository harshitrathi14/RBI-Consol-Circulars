"""
Streamlit Frontend for RBI Master Circulars RAG Chatbot
A comprehensive interface with Dashboard, Document Library, and Chat
"""
import streamlit as st
import httpx
from typing import Optional, List, Dict
import socket
import json

from config import settings

# Page configuration
st.set_page_config(
    page_title="RBI Circulars Assistant",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2rem;
        font-weight: bold;
        color: #1a365d;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        font-size: 1rem;
        color: #4a5568;
        margin-bottom: 1rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 1rem;
        color: white;
        text-align: center;
    }
    .metric-value {
        font-size: 2.5rem;
        font-weight: bold;
    }
    .metric-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    .circular-card {
        background-color: #f8fafc;
        padding: 1.25rem;
        border-radius: 0.75rem;
        border-left: 4px solid #3182ce;
        margin-bottom: 1rem;
        transition: all 0.2s;
    }
    .circular-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .circular-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a365d;
        margin-bottom: 0.5rem;
    }
    .circular-meta {
        font-size: 0.85rem;
        color: #718096;
    }
    .category-badge {
        display: inline-block;
        background-color: #ebf8ff;
        color: #2b6cb0;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        font-weight: 500;
    }
    .summary-point {
        background-color: #f0fff4;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        margin: 0.25rem 0;
        font-size: 0.9rem;
        border-left: 3px solid #38a169;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
    }
    .user-message {
        background-color: #e2e8f0;
        margin-left: 2rem;
    }
    .assistant-message {
        background-color: #f0fff4;
        border-left: 4px solid #38a169;
        margin-right: 2rem;
    }
    .referenced-circulars {
        background-color: #fffbeb;
        border: 1px solid #f59e0b;
        border-radius: 0.5rem;
        padding: 0.75rem;
        margin-top: 0.75rem;
    }
    .source-card {
        background-color: #f7fafc;
        padding: 0.75rem;
        border-radius: 0.375rem;
        margin-top: 0.5rem;
        border: 1px solid #e2e8f0;
    }
    .status-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 0.5rem;
    }
    .status-ok { background-color: #38a169; }
    .status-error { background-color: #e53e3e; }
    .info-box {
        background-color: #ebf8ff;
        border-left: 4px solid #3182ce;
        padding: 1rem;
        border-radius: 0 0.5rem 0.5rem 0;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)


def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


def check_api_health():
    """Check if the API is healthy"""
    try:
        response = httpx.get(
            f"http://localhost:{settings.API_PORT}/health",
            timeout=5
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception:
        return None


def get_stats():
    """Fetch document statistics from API"""
    try:
        response = httpx.get(
            f"http://localhost:{settings.API_PORT}/stats",
            timeout=5
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception:
        return None


def get_categories():
    """Fetch categories from API"""
    try:
        response = httpx.get(
            f"http://localhost:{settings.API_PORT}/categories",
            timeout=5
        )
        if response.status_code == 200:
            return response.json()
        return ["All Categories"]
    except Exception:
        return ["All Categories"]


def get_all_documents(category: Optional[str] = None):
    """Fetch all documents from API"""
    try:
        url = f"http://localhost:{settings.API_PORT}/documents"
        if category and category != "All Categories":
            url += f"?category={category}"
        response = httpx.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception:
        return []


def query_api(question: str, category: Optional[str] = None):
    """Send query to the API"""
    try:
        payload = {"question": question}
        if category and category != "All Categories":
            payload["category"] = category

        response = httpx.post(
            f"http://localhost:{settings.API_PORT}/query",
            json=payload,
            timeout=120
        )

        if response.status_code == 200:
            return response.json(), None
        else:
            return None, response.json().get("detail", "Unknown error")
    except httpx.TimeoutException:
        return None, "Request timed out. The query may be too complex."
    except Exception as e:
        return None, str(e)


def initialize_session_state():
    """Initialize Streamlit session state"""
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "selected_category" not in st.session_state:
        st.session_state.selected_category = "All Categories"


def render_sidebar():
    """Render the sidebar"""
    with st.sidebar:
        st.markdown("### 🏛️ RBI Circulars Assistant")
        st.markdown("_Regulatory Intelligence for NBFCs_")

        st.markdown("---")

        # System status
        st.markdown("#### System Status")
        health = check_api_health()

        if health:
            ollama_ok = health["ollama_status"] == "ok"
            st.markdown(f"""
            <div style="padding: 0.75rem; background: {'#f0fff4' if ollama_ok else '#fff5f5'}; border-radius: 0.5rem;">
                <span class="status-indicator {'status-ok' if True else 'status-error'}"></span> <strong>API:</strong> Online<br>
                <span class="status-indicator {'status-ok' if ollama_ok else 'status-error'}"></span> <strong>LLM:</strong> {health['ollama_message'][:25]}...<br>
                <strong>Indexed:</strong> {health['documents_indexed']} chunks
            </div>
            """, unsafe_allow_html=True)
        else:
            st.error("API is offline. Start it with: `python api.py`")

        st.markdown("---")

        # Network info
        st.markdown("#### Network Access")
        local_ip = get_local_ip()
        st.code(f"http://{local_ip}:{settings.STREAMLIT_PORT}")
        st.caption("Share with colleagues on same network")

        st.markdown("---")

        # Actions
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Clear Chat", use_container_width=True):
                st.session_state.messages = []
                st.rerun()
        with col2:
            if st.button("Rebuild Index", use_container_width=True):
                with st.spinner("Starting..."):
                    try:
                        response = httpx.post(
                            f"http://localhost:{settings.API_PORT}/rebuild-index",
                            timeout=10
                        )
                        if response.status_code == 200:
                            st.success("Rebuild started!")
                        else:
                            st.error("Failed")
                    except Exception as e:
                        st.error(f"Error: {e}")


def render_dashboard():
    """Render the dashboard tab"""
    st.markdown("## Dashboard")
    st.markdown("_Overview of indexed RBI Master Circulars_")

    stats = get_stats()

    if stats:
        # Key metrics
        col1, col2, col3 = st.columns(3)

        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{stats['total_documents']}</div>
                <div class="metric-label">Total Circulars</div>
            </div>
            """, unsafe_allow_html=True)

        with col2:
            st.markdown(f"""
            <div class="metric-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
                <div class="metric-value">{stats['total_chunks']}</div>
                <div class="metric-label">Indexed Chunks</div>
            </div>
            """, unsafe_allow_html=True)

        with col3:
            st.markdown(f"""
            <div class="metric-card" style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);">
                <div class="metric-value">{len(stats['categories'])}</div>
                <div class="metric-label">Categories</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")

        # Category breakdown
        st.markdown("### Category Distribution")

        if stats['categories']:
            # Create a simple bar chart using columns
            categories = list(stats['categories'].items())
            categories.sort(key=lambda x: x[1], reverse=True)

            for cat, count in categories:
                col1, col2 = st.columns([3, 1])
                with col1:
                    progress = count / max(stats['categories'].values())
                    st.progress(progress, text=f"{cat}")
                with col2:
                    st.markdown(f"**{count}** chunks")

        st.markdown("---")

        # Quick info
        st.markdown("### Quick Information")
        st.markdown("""
        <div class="info-box">
            <strong>About RBI Master Circulars for NBFCs</strong><br>
            RBI Master Circulars consolidate instructions on various regulatory aspects for
            Non-Banking Financial Companies (NBFCs). These cover:
            <ul>
                <li>Prudential norms and capital requirements</li>
                <li>Asset classification and provisioning</li>
                <li>Corporate governance standards</li>
                <li>KYC/AML compliance requirements</li>
                <li>Fair practices code and customer protection</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.warning("Unable to fetch statistics. Is the API running?")


def render_document_library():
    """Render the document library tab"""
    st.markdown("## Circular Library")
    st.markdown("_Browse all indexed RBI Master Circulars_")

    # Category filter
    categories = get_categories()
    col1, col2 = st.columns([2, 4])
    with col1:
        selected_cat = st.selectbox(
            "Filter by Category",
            options=categories,
            key="lib_category"
        )

    # Search within documents
    with col2:
        search_term = st.text_input("Search circulars", placeholder="Type to search...")

    # Get documents
    documents = get_all_documents(selected_cat)

    # Filter by search term
    if search_term:
        search_lower = search_term.lower()
        documents = [
            d for d in documents
            if search_lower in (d.get("circular_title") or "").lower()
            or search_lower in (d.get("subject") or "").lower()
            or search_lower in (d.get("circular_number") or "").lower()
        ]

    st.markdown(f"**Found {len(documents)} circular(s)**")
    st.markdown("---")

    if documents:
        for doc in documents:
            with st.container():
                # Circular card
                title = doc.get("circular_title") or doc.get("subject") or doc.get("filename")
                category = doc.get("category", "General")
                circular_num = doc.get("circular_number")
                circular_date = doc.get("circular_date")
                summary_points = doc.get("summary_points", [])

                st.markdown(f"""
                <div class="circular-card">
                    <div class="circular-title">{title}</div>
                    <div class="circular-meta">
                        <span class="category-badge">{category}</span>
                        {f' | Ref: {circular_num}' if circular_num else ''}
                        {f' | Date: {circular_date}' if circular_date else ''}
                        | Chunks: {doc.get('total_chunks', 0)}
                    </div>
                </div>
                """, unsafe_allow_html=True)

                # Summary points in expander
                if summary_points:
                    with st.expander("View Summary Points"):
                        for point in summary_points:
                            st.markdown(f"""
                            <div class="summary-point">{point}</div>
                            """, unsafe_allow_html=True)

                st.markdown("")
    else:
        st.info("No circulars found. Try adjusting your filter or search term.")


def render_chat():
    """Render the chat tab"""
    st.markdown("## Regulatory Query Assistant")
    st.markdown("_Ask questions about RBI Master Circulars for NBFCs_")

    # Category filter for queries
    categories = get_categories()
    col1, col2 = st.columns([2, 4])
    with col1:
        selected_category = st.selectbox(
            "Filter by Category",
            options=categories,
            key="chat_category",
            help="Narrow down search to specific regulatory category"
        )
        st.session_state.selected_category = selected_category

    if selected_category != "All Categories":
        st.info(f"Filtering queries to: **{selected_category}**")

    st.markdown("---")

    # Chat container
    chat_container = st.container()

    # Display chat history
    with chat_container:
        for i, message in enumerate(st.session_state.messages):
            if message["role"] == "user":
                with st.chat_message("user"):
                    st.markdown(message["content"])
            else:
                with st.chat_message("assistant"):
                    st.markdown(message["content"])

                    # Show circulars referenced
                    if "circulars_referenced" in message and message["circulars_referenced"]:
                        st.markdown(f"""
                        <div class="referenced-circulars">
                            <strong>📚 Circulars Referenced:</strong><br>
                            {', '.join(message['circulars_referenced'][:5])}
                        </div>
                        """, unsafe_allow_html=True)

                    # Display sources if available
                    if "sources" in message and message["sources"]:
                        with st.expander(f"View {len(message['sources'])} Source References"):
                            for j, source in enumerate(message["sources"]):
                                title = source.get('circular_title') or source.get('filename', 'Unknown')
                                st.markdown(f"""
                                **Reference {j+1}: {title}**
                                - Category: `{source.get('category', 'Unknown')}`
                                - Circular No: {source.get('circular_number', 'N/A')}
                                - Date: {source.get('circular_date', 'N/A')}

                                _{source.get('chunk_preview', '')}_
                                """)
                                st.markdown("---")

                    # Copy button
                    col1, col2 = st.columns([6, 1])
                    with col2:
                        if st.button("📋", key=f"copy_{i}", help="Copy response"):
                            st.toast("Response copied!")

    # Chat input
    if prompt := st.chat_input("Ask about RBI regulations for NBFCs..."):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})

        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)

        # Get response
        with st.chat_message("assistant"):
            with st.spinner("Searching circulars and generating response..."):
                result, error = query_api(prompt, st.session_state.selected_category)

                if error:
                    response_text = f"Error: {error}"
                    st.error(response_text)
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": response_text,
                        "sources": [],
                        "circulars_referenced": []
                    })
                else:
                    response_text = result["answer"]
                    sources = result.get("sources", [])
                    circulars_ref = result.get("circulars_referenced", [])

                    st.markdown(response_text)

                    # Show circulars referenced prominently
                    if circulars_ref:
                        st.markdown(f"""
                        <div class="referenced-circulars">
                            <strong>📚 Circulars Referenced:</strong><br>
                            {', '.join(circulars_ref[:5])}
                        </div>
                        """, unsafe_allow_html=True)

                    # Store message
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": response_text,
                        "sources": sources,
                        "circulars_referenced": circulars_ref
                    })

                    # Show sources
                    if sources:
                        with st.expander(f"View {len(sources)} Source References"):
                            for j, source in enumerate(sources):
                                title = source.get('circular_title') or source.get('filename', 'Unknown')
                                st.markdown(f"""
                                **Reference {j+1}: {title}**
                                - Category: `{source.get('category', 'Unknown')}`
                                - Circular No: {source.get('circular_number', 'N/A')}
                                - Date: {source.get('circular_date', 'N/A')}

                                _{source.get('chunk_preview', '')}_
                                """)
                                st.markdown("---")

    # Example queries for empty chat
    if not st.session_state.messages:
        st.markdown("### Example Queries")
        st.markdown("_Click on any question to try it_")

        example_queries = [
            "What are the capital adequacy requirements for NBFCs?",
            "Explain the asset classification norms for NBFCs",
            "What is the Fair Practices Code for NBFCs?",
            "What are the KYC requirements for NBFCs?",
            "Explain liquidity risk management guidelines",
            "What are the board composition requirements for NBFCs?"
        ]

        cols = st.columns(2)
        for i, query in enumerate(example_queries):
            with cols[i % 2]:
                if st.button(f"💬 {query}", key=f"example_{i}", use_container_width=True):
                    st.session_state.messages.append({"role": "user", "content": query})
                    st.rerun()


def main():
    initialize_session_state()
    render_sidebar()

    # Main header
    st.markdown('<p class="main-header">RBI Master Circulars for NBFCs</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="sub-header">Regulatory Intelligence & Compliance Assistant</p>',
        unsafe_allow_html=True
    )

    # Tab navigation
    tab1, tab2, tab3 = st.tabs(["📊 Dashboard", "📚 Circular Library", "💬 Ask Questions"])

    with tab1:
        render_dashboard()

    with tab2:
        render_document_library()

    with tab3:
        render_chat()


if __name__ == "__main__":
    main()
