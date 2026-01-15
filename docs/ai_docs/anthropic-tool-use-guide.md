# Anthropic Claude Tool Use Implementation Guide

**Source:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use

## Choosing a Model

- **Claude Sonnet 4.5 or Opus 4.5**: Recommended for complex tools and ambiguous queries; handles multiple tools better and seeks clarification when needed
- **Claude Haiku**: Use for straightforward tools, but note they may infer missing parameters

## Specifying Client Tools

Tools are specified in the `tools` top-level parameter of the API request. Each tool definition includes:

| Parameter | Description |
|-----------|-------------|
| `name` | The name of the tool. Must match regex `^[a-zA-Z0-9_-]{1,64}$` |
| `description` | A detailed plaintext description of what the tool does, when it should be used, and how it behaves |
| `input_schema` | A JSON Schema object defining the expected parameters for the tool |
| `input_examples` | (Optional, beta) An array of example input objects |

### Example Tool Definition

```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "The unit of temperature, either 'celsius' or 'fahrenheit'"
      }
    },
    "required": ["location"]
  }
}
```

## Best Practices for Tool Definitions

1. **Provide extremely detailed descriptions** - This is the most important factor:
   - What the tool does
   - When it should be used (and when it shouldn't)
   - What each parameter means and how it affects behavior
   - Any important caveats or limitations
   - Aim for at least 3-4 sentences per tool description

2. **Use `input_examples` for complex tools** - For tools with complex inputs, nested objects, or format-sensitive parameters

### Good Tool Description Example

```json
{
  "name": "get_stock_price",
  "description": "Retrieves the current stock price for a given ticker symbol. The ticker symbol must be a valid symbol for a publicly traded company on a major US stock exchange like NYSE or NASDAQ. The tool will return the latest trade price in USD. It should be used when the user asks about the current or most recent price of a specific stock. It will not provide any other information about the stock or company.",
  "input_schema": {
    "type": "object",
    "properties": {
      "ticker": {
        "type": "string",
        "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
      }
    },
    "required": ["ticker"]
  }
}
```

## Tool Runner (Beta)

The tool runner provides an out-of-the-box solution for executing tools with Claude:

- Executes tools when Claude calls them
- Handles the request/response cycle
- Manages conversation state
- Provides type safety and validation

### Python Example with `@beta_tool` Decorator

```python
import anthropic
import json
from anthropic import beta_tool

client = anthropic.Anthropic()

@beta_tool
def get_weather(location: str, unit: str = "fahrenheit") -> str:
    """Get the current weather in a given location.

    Args:
        location: The city and state, e.g. San Francisco, CA
        unit: Temperature unit, either 'celsius' or 'fahrenheit'
    """
    return json.dumps({"temperature": "20°C", "condition": "Sunny"})

runner = client.beta.messages.tool_runner(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    tools=[get_weather],
    messages=[
        {"role": "user", "content": "What's the weather like in Paris?"}
    ]
)
for message in runner:
    print(message.content[0].text)
```

### TypeScript Example with Zod

```typescript
import { Anthropic } from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

const anthropic = new Anthropic();

const getWeatherTool = betaZodTool({
  name: 'get_weather',
  description: 'Get the current weather in a given location',
  inputSchema: z.object({
    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    unit: z.enum(['celsius', 'fahrenheit']).default('fahrenheit')
      .describe('Temperature unit')
  }),
  run: async (input) => {
    return JSON.stringify({temperature: '20°C', condition: 'Sunny'});
  }
});

const runner = anthropic.beta.messages.toolRunner({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  tools: [getWeatherTool],
  messages: [{ role: 'user', content: "What's the weather like in Paris?" }]
});

for await (const message of runner) {
  console.log(message.content[0].text);
}
```

## Controlling Claude's Output

### Forcing Tool Use

Use `tool_choice` parameter:
- `auto`: Claude decides whether to call tools (default)
- `any`: Must use one of the provided tools
- `tool`: Force a specific tool: `{"type": "tool", "name": "get_weather"}`
- `none`: Prevent tool use

### Parallel Tool Use

By default, Claude may use multiple tools to answer a query. Control with:
- `disable_parallel_tool_use=true` with `auto`: At most one tool
- `disable_parallel_tool_use=true` with `any`/`tool`: Exactly one tool

### Maximizing Parallel Tool Use

Add to system prompt:
```
For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
```

## Handling Tool Results

When Claude requests a tool, the response includes:
- `id`: Unique identifier for the tool use
- `name`: The tool being used
- `input`: Parameters for the tool

Return results with:
```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
      "content": "15 degrees"
    }
  ]
}
```

### Important Formatting Requirements

- Tool result blocks must immediately follow their corresponding tool use blocks
- In user messages, `tool_result` blocks must come FIRST, then any text

## Error Handling

For tool execution errors:
```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
      "content": "ConnectionError: the weather service API is not available",
      "is_error": true
    }
  ]
}
```

## Server Tools

Anthropic-defined tools use versioned types:
- `web_search_20250305`
- `text_editor_20250124`
- `web_fetch`

These execute on Anthropic's servers and don't require implementation on your part.

## Advanced Features (Beta)

Enable with beta headers:

1. **Programmatic Tool Calling** (`advanced-tool-use-2025-11-20`): Claude orchestrates tools through code
2. **Tool Search Tool** (`tool-search-tool-2025-10-19`): Work with hundreds of tools without loading all definitions
3. **Fine-grained Tool Streaming** (`fine-grained-tool-streaming-2025-05-14`): Stream tool parameters without buffering
4. **Automatic Tool Call Clearing** (`context-management-2025-06-27`): Auto-clear old tool results at token limits
