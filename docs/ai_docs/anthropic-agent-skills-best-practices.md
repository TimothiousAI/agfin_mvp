# Anthropic Agent Skills Best Practices

**Source:** https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

## Core Principles

### 1. Concise is Key

The context window is a public good. Your Skill shares context with:
- System prompt
- Conversation history
- Other Skills' metadata
- Your actual request

**Default assumption**: Claude is already very smart. Only add context Claude doesn't already have.

**Good example (~50 tokens):**
```markdown
## Extract PDF text

Use pdfplumber for text extraction:

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
```

### 2. Set Appropriate Degrees of Freedom

**High freedom** (text-based instructions):
- Multiple approaches are valid
- Decisions depend on context
- Heuristics guide the approach

**Medium freedom** (pseudocode with parameters):
- A preferred pattern exists
- Some variation is acceptable

**Low freedom** (specific scripts):
- Operations are fragile
- Consistency is critical
- Specific sequence required

### 3. Test with All Models

- **Claude Haiku**: Does the Skill provide enough guidance?
- **Claude Sonnet**: Is the Skill clear and efficient?
- **Claude Opus**: Does the Skill avoid over-explaining?

## Skill Structure

### Naming Conventions

Use **gerund form** (verb + -ing):
- `processing-pdfs`
- `analyzing-spreadsheets`
- `managing-databases`

Requirements:
- Maximum 64 characters
- Lowercase letters, numbers, hyphens only
- No reserved words: "anthropic", "claude"

### Writing Effective Descriptions

**Always write in third person:**
- Good: "Processes Excel files and generates reports"
- Avoid: "I can help you process Excel files"

**Be specific and include key terms:**
```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

## Progressive Disclosure Patterns

Keep SKILL.md under 500 lines. Split content into separate files when needed.

### Pattern 1: High-level Guide with References

```markdown
# PDF Processing

## Quick start
[Basic instructions]

## Advanced features
**Form filling**: See [FORMS.md](FORMS.md) for complete guide
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
```

### Pattern 2: Domain-specific Organization

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md
    ├── sales.md
    ├── product.md
    └── marketing.md
```

### Keep References One Level Deep

**Bad (too deep):**
```
SKILL.md → advanced.md → details.md
```

**Good:**
```
SKILL.md → advanced.md
SKILL.md → reference.md
SKILL.md → examples.md
```

## Workflows and Feedback Loops

### Use Workflows for Complex Tasks

```markdown
## Document editing process

1. Make your edits to `word/document.xml`
2. **Validate immediately**: `python validate.py`
3. If validation fails:
   - Review the error message
   - Fix the issues
   - Run validation again
4. **Only proceed when validation passes**
5. Rebuild and test output
```

### Implement Feedback Loops

Pattern: Run validator → fix errors → repeat

## Content Guidelines

### Avoid Time-Sensitive Information

**Bad:**
```markdown
If you're doing this before August 2025, use the old API.
```

**Good:**
```markdown
## Current method
Use the v2 API endpoint.

## Old patterns
<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>
...
</details>
```

### Use Consistent Terminology

Choose one term and use it throughout:
- Always "API endpoint" (not mix of "URL", "route", "path")
- Always "field" (not mix of "box", "element", "control")

## Common Patterns

### Template Pattern

```markdown
## Report structure

ALWAYS use this exact template:

```markdown
# [Analysis Title]

## Executive summary
[One-paragraph overview]

## Key findings
- Finding 1
- Finding 2

## Recommendations
1. Recommendation 1
2. Recommendation 2
```
```

### Examples Pattern

```markdown
## Commit message format

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly
Output:
```
fix(reports): correct date formatting in timezone conversion
```
```

## Skills with Executable Code

### Solve, Don't Punt

Handle error conditions explicitly:

```python
def process_file(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"File {path} not found, creating default")
        with open(path, 'w') as f:
            f.write('')
        return ''
```

### Provide Utility Scripts

Benefits:
- More reliable than generated code
- Save tokens
- Ensure consistency

### Create Verifiable Intermediate Outputs

Pattern: analyze → **create plan file** → **validate plan** → execute → verify

## Checklist for Effective Skills

### Core Quality
- [ ] Description is specific with key terms
- [ ] SKILL.md body under 500 lines
- [ ] No time-sensitive information
- [ ] Consistent terminology
- [ ] Progressive disclosure used appropriately

### Code and Scripts
- [ ] Scripts handle errors explicitly
- [ ] No "voodoo constants"
- [ ] Required packages listed
- [ ] Unix-style paths (forward slashes)

### Testing
- [ ] At least three evaluations created
- [ ] Tested with Haiku, Sonnet, and Opus
- [ ] Tested with real usage scenarios
