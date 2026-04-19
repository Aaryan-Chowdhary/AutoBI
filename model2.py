import fitz
import re
from docx import Document
from google import genai
from sentence_transformers import SentenceTransformer
import chromadb
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
client_genai = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


client = chromadb.Client(
    settings=chromadb.Settings(
        persist_directory="./chroma_db"
    )
)

collection = client.get_or_create_collection(name="documents")

def load_file(path):
    path = path.lower()

    if path.endswith(".txt"):
        with open(path,'r',encoding='utf-8') as f:
            return f.read()
    
    elif path.endswith(".pdf"):
        pdf = fitz.open(path)
        return "\n".join(page.get_text() for page in pdf)
    
    elif path.endswith(".docx"):
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    
    else:
        raise ValueError("Unsupported file format. Allowed: .txt, .pdf, .docx")
    
def upload_file_from_path(path):

    

    filename = os.path.basename(path)
    existing = collection.get(where={"source": filename})

    if existing["ids"]:
        print(f"{filename} already exists in database")
        return

    text = load_file(path)

    ingest_document(filename, text)

def clean_text(text):
    text = text.replace("\r"," ")
    text = re.sub(r"\n+","\n",text)
    text = re.sub(r" +"," ",text)
    text = text.strip()
    return text

def chunk_text(text, max_size=350):
    lines = text.split("\n")
    chunks = []
    current = ""

    for line in lines:
        line = line.strip()

        # Detect question or heading like: Q1., Q1:, Q1 xyz, Q1-xyz, Definition:, Production System:
        if re.match(r"^(Q\d+[\.\:\-]?\s.*|[A-Z][a-zA-Z ]+[:\-]$)", line) and current:
            chunks.append(current.strip())
            current = line + " "
        else:
            if len(current) + len(line) < max_size:
                current += line + " "
            else:
                chunks.append(current.strip())
                current = line + " "

    if current:
        chunks.append(current.strip())

    return chunks




def ingest_document(filename, text):

    cleaned_text = clean_text(text)

    chunks = chunk_text(cleaned_text)

    embeddings = embedding_model.encode(chunks, normalize_embeddings=True)

    metadatas = [{"source": filename} for _ in chunks]

    ids = [f"{filename}_{i}" for i in range(len(chunks))]

    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=ids,
        metadatas=metadatas
    )

    print(f"Added {filename} ({len(chunks)} chunks)")

def generate_answer(question, context_chunks):

    context = "\n\n".join(context_chunks)

    prompt = f"""
You are a helpful assistant. Answer ONLY using the context below you can use a bit to formulate the answer and add only slight bit of info to enhance it.

Context:
{context}

Question:
{question}

Answer:
"""

    response = client_genai.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text



print("💬 qna-r ready!")
print("Commands:")
print("upload <filepath>")
print("ask <question>")
print("exit\n")

while True:

    user_input = input("> ")

    if user_input.lower() in ["exit", "quit", "stop"]: 
        break

    elif user_input.startswith("upload "):

        path = user_input.replace("upload ", "").strip()

        try:
            upload_file_from_path(path)
        except Exception as e:
            print("Upload failed:", e)

    elif user_input.startswith("ask "):

        q = user_input.replace("ask ", "").strip()

        q_embedding = embedding_model.encode(q, normalize_embeddings=True)

        results = collection.query(
            query_embeddings=[q_embedding],
            n_results=3
        )

        retrieved_chunks = results["documents"][0]
        retrieved_sources = results["metadatas"][0]

        unique_sources = list(
            set(meta["source"] for meta in retrieved_sources)
        )

        answer = generate_answer(q, retrieved_chunks)

        print("\nAnswer:\n", answer)

        print("\nSources:")
        for s in unique_sources:
            print("-", s)

    else:
        print("Unknown command")
