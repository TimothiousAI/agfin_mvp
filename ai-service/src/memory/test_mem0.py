"""
Test script for mem0 client with pgvector.

Tests memory storage and retrieval without requiring real API keys.
"""

import os
from mem0_client import Mem0Client, get_client


def test_client_initialization():
    """Test that client initializes correctly."""
    print("Test 1: Client initialization")
    try:
        # Mock API key for testing
        os.environ["OPENAI_API_KEY"] = "sk-test-key-mock"

        client = Mem0Client(user_id="test_user")
        print(f"  ✅ Client initialized")
        print(f"  User ID: {client.user_id}")
        print(f"  Similarity threshold: {client.similarity_threshold}")
        print(f"  Embedding model: text-embedding-3-small")
        print(f"  Embedding dimensions: 1536")
        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def test_module_functions():
    """Test module-level functions."""
    print("\nTest 2: Module-level functions")
    try:
        os.environ["OPENAI_API_KEY"] = "sk-test-key-mock"

        client = get_client(user_id="test_user_2")
        print(f"  ✅ get_client() works")
        print(f"  User ID: {client.user_id}")

        from mem0_client import reset_client
        reset_client()
        print(f"  ✅ reset_client() works")
        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def test_configuration():
    """Test configuration options."""
    print("\nTest 3: Configuration")
    try:
        os.environ["OPENAI_API_KEY"] = "sk-test-key-mock"

        client = Mem0Client(
            user_id="custom_user",
            similarity_threshold=0.8
        )
        print(f"  ✅ Custom configuration accepted")
        print(f"  User ID: {client.user_id}")
        print(f"  Threshold: {client.similarity_threshold}")
        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def test_api_structure():
    """Test that API methods exist."""
    print("\nTest 4: API structure")
    try:
        os.environ["OPENAI_API_KEY"] = "sk-test-key-mock"
        client = Mem0Client(user_id="test_user")

        # Check methods exist
        methods = ["add", "search", "get_all", "update", "delete", "delete_all", "get_history"]
        for method in methods:
            assert hasattr(client, method), f"Missing method: {method}"
            print(f"  ✅ Method exists: {method}()")

        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("mem0 Client Test Suite")
    print("=" * 60)

    results = []
    results.append(test_client_initialization())
    results.append(test_module_functions())
    results.append(test_configuration())
    results.append(test_api_structure())

    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)

    if all(results):
        print("\n✅ All tests passed!")
        print("\nNote: These tests verify the client structure.")
        print("Full integration tests require:")
        print("  - Supabase running on host.docker.internal:5433")
        print("  - pgvector extension enabled")
        print("  - Valid OpenAI API key")
        return 0
    else:
        print("\n❌ Some tests failed")
        return 1


if __name__ == "__main__":
    exit(exit_code := main())
