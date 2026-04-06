"""
Qdrant Vector Store - Stores and retrieves similar bug reports/solutions
Uses sentence-transformers for local embeddings (fully open source)
Compatible with qdrant-client >= 1.7 (uses query_points instead of search)
"""
import os
from typing import List, Optional
from qdrant_client import AsyncQdrantClient, QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import uuid
import hashlib

COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "debugai_knowledge")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
VECTOR_SIZE = 384  # all-MiniLM-L6-v2 output dim

# Global instances
_embedder: Optional[SentenceTransformer] = None
_client: Optional[AsyncQdrantClient] = None
_sync_client: Optional[QdrantClient] = None


def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        print(f"📦 Loading embedding model: {EMBEDDING_MODEL}")
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder


def get_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        _client = AsyncQdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    return _client


async def initialize_qdrant():
    """Create collection if it doesn't exist."""
    client = get_client()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]

    if COLLECTION_NAME not in names:
        await client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        print(f"✅ Created Qdrant collection: {COLLECTION_NAME}")
        # Seed with common bug patterns
        await _seed_knowledge_base()
    else:
        print(f"✅ Qdrant collection exists: {COLLECTION_NAME}")


async def _seed_knowledge_base():
    """Seed with common debugging patterns for cold start."""
    seed_data = [
        {
            "title": "NullPointerException in Spring Boot Service",
            "description": "NPE thrown when accessing uninitialized bean or null reference in service layer",
            "resolution": "Check @Autowired fields are properly initialized. Add null checks before accessing objects. Use Optional<> for nullable fields.",
            "tags": ["java", "spring", "npe"],
            "language": "java"
        },
        {
            "title": "Database Connection Pool Exhaustion",
            "description": "All connections in pool are exhausted causing timeouts across microservices",
            "resolution": "Increase pool size via spring.datasource.hikari.maximum-pool-size. Check for connection leaks - ensure connections are closed in finally blocks. Add connection timeout monitoring.",
            "tags": ["database", "connection-pool", "timeout", "microservices"],
            "language": "java"
        },
        {
            "title": "Redis Cache KeyError / Cache Miss Storm",
            "description": "Thundering herd problem when cache expires and multiple requests hit the database simultaneously",
            "resolution": "Implement cache-aside pattern with mutex lock. Use probabilistic early expiration. Add cache warming on startup.",
            "tags": ["redis", "cache", "python", "performance"],
            "language": "python"
        },
        {
            "title": "Kubernetes Pod OOMKilled",
            "description": "Container killed due to exceeding memory limits causing service disruption",
            "resolution": "Profile memory usage with heaptrack or py-spy. Increase resource limits in deployment YAML. Check for memory leaks in long-running processes.",
            "tags": ["kubernetes", "oom", "memory", "devops"],
            "language": "yaml"
        },
        {
            "title": "gRPC Deadline Exceeded across services",
            "description": "gRPC calls timing out in distributed microservice calls causing cascading failures",
            "resolution": "Implement retry with exponential backoff. Add circuit breaker pattern. Tune deadline propagation. Use deadline-aware context passing.",
            "tags": ["grpc", "microservices", "timeout", "distributed"],
            "language": "go"
        },
        {
            "title": "Python asyncio RuntimeError: event loop closed",
            "description": "Async event loop is closed before coroutines complete, common in FastAPI/aiohttp apps",
            "resolution": "Use asyncio.run() properly. Don't mix sync and async contexts. Use async context managers. Avoid calling loop.close() while tasks are pending.",
            "tags": ["python", "asyncio", "fastapi", "async"],
            "language": "python"
        },
        {
            "title": "React useEffect infinite loop",
            "description": "useEffect triggers on every render because dependency array contains object or function references",
            "resolution": "Memoize objects with useMemo, functions with useCallback. Use primitive values in dependency array. Consider useRef for values that shouldn't trigger re-renders.",
            "tags": ["react", "javascript", "hooks", "frontend"],
            "language": "javascript"
        },
        {
            "title": "Kafka Consumer Lag Increasing",
            "description": "Consumer group lag growing indicating consumer can't keep up with producer throughput",
            "resolution": "Scale consumer instances. Optimize message processing logic. Increase partition count. Use parallel processing within consumer. Check for slow database queries blocking consumption.",
            "tags": ["kafka", "microservices", "messaging", "performance"],
            "language": "java"
        },
    ]

    embedder = get_embedder()
    client = get_client()
    points = []

    for item in seed_data:
        text = f"{item['title']} {item['description']} {item['resolution']}"
        vector = embedder.encode(text).tolist()
        point_id = int(hashlib.md5(item['title'].encode()).hexdigest()[:8], 16)
        points.append(PointStruct(
            id=point_id,
            vector=vector,
            payload=item
        ))

    await client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"🌱 Seeded {len(points)} knowledge base entries")


async def search_similar(query: str, limit: int = 3) -> List[dict]:
    """Search for similar issues in the knowledge base.
    Uses query_points (qdrant-client >= 1.7) with fallback to search.
    """
    embedder = get_embedder()
    client = get_client()

    query_vector = embedder.encode(query).tolist()

    try:
        # qdrant-client >= 1.7.0 — preferred API
        results = await client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=limit,
            with_payload=True,
            score_threshold=0.3,
        )
        # query_points returns a QueryResponse with .points
        points = results.points if hasattr(results, "points") else results

    except AttributeError:
        # Fallback for older qdrant-client versions that have .search
        points = await client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=limit,
            with_payload=True,
            score_threshold=0.3,
        )

    return [
        {
            "title": r.payload.get("title", ""),
            "description": r.payload.get("description", ""),
            "resolution": r.payload.get("resolution", ""),
            "similarity_score": r.score,
            "tags": r.payload.get("tags", [])
        }
        for r in points
    ]


async def store_issue(title: str, description: str, resolution: str,
                      tags: List[str] = None, language: str = None) -> str:
    """Store a new resolved issue in the knowledge base."""
    embedder = get_embedder()
    client = get_client()

    text = f"{title} {description} {resolution}"
    vector = embedder.encode(text).tolist()
    point_id = str(uuid.uuid4())

    await client.upsert(
        collection_name=COLLECTION_NAME,
        points=[PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "title": title,
                "description": description,
                "resolution": resolution,
                "tags": tags or [],
                "language": language
            }
        )]
    )
    return point_id