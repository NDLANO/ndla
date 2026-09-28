# MCP server

MCP server that gives AI assistants read access to NDLA content. It uses the public NDLA APIs without authentication, so it only serves content that is already open on ndla.no.

## Usage

Add `https://api.ndla.no/mcp` as a remote MCP server in your client, e.g. with Claude Code:

```sh
claude mcp add --transport http ndla https://api.ndla.no/mcp
```

Test and staging are available at `api.test.ndla.no/mcp` and `api.staging.ndla.no/mcp`.

## Tools

- `search`: search articles and learning paths
- `get_article`: an article as Markdown
- `fetch_ndla_url`: the content behind an ndla.no link
- `get_learningpath`: a learning path with its steps
- `list_subjects` and `browse_node`: subjects, topics and resources from taxonomy
- `search_concepts`: concepts and glosses
- `search_curriculum`: competence goals and core elements from GREP
- `search_images` and `search_audio`: images, audio and podcasts
