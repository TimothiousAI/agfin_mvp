"""
Test script for Claude client functionality.

This demonstrates the client API and can be used for verification.
"""

import asyncio
from client import ClaudeClient, get_client


async def test_client_initialization():
    """Test that client initializes correctly."""
    print("Test 1: Client initialization")
    try:
        client = ClaudeClient()
        print(f"  ✅ Client initialized")
        print(f"  Model: {client.model}")
        print(f"  Max tokens: {client.max_tokens}")
        print(f"  Temperature: {client.temperature}")
        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


async def test_module_client():
    """Test module-level get_client() function."""
    print("\nTest 2: Module-level client")
    try:
        client = get_client()
        print(f"  ✅ Module client retrieved")
        print(f"  Model: {client.model}")
        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


async def test_tool_definition():
    """Test that tool definitions can be created."""
    print("\nTest 3: Tool definition structure")
    try:
        # Example tool definition for tool_runner
        tool = {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name"
                    }
                },
                "required": ["location"]
            }
        }
        print(f"  ✅ Tool definition created")
        print(f"  Tool name: {tool['name']}")
        print(f"  Tool description: {tool['description']}")
        return True
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


async def main():
    """Run all tests."""
    print("=" * 60)
    print("Claude Client Test Suite")
    print("=" * 60)

    results = []
    results.append(await test_client_initialization())
    results.append(await test_module_client())
    results.append(await test_tool_definition())

    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)

    if all(results):
        print("\n✅ All tests passed!")
        return 0
    else:
        print("\n❌ Some tests failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
