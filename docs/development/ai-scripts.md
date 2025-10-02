# 🤖 AI Development Scripts

Quick reference for AI-related npm scripts:

## Setup & Testing

```bash
# Test AI integration (checks Ollama connection, models, prompts)
npm run ai:test

# Start full development environment with AI services
npm run ai:start
```

## Docker Management

```bash
# Start only Ollama service
npm run ai:docker

# View Ollama logs
npm run ai:logs

# Get shell access to Ollama container
npm run ai:shell
```

## Model Management

```bash
# List installed models
npm run ai:models

# Pull recommended models
npm run ai:pull:deepseek    # DeepSeek-R1 7B (4.7GB) - Best reasoning
npm run ai:pull:llama       # Llama 3.2 3B (2.0GB) - Good balance
npm run ai:pull:phi         # Phi-4 Mini (2.5GB) - Microsoft model
```

## Development Workflow

1. **First time setup:**

   ```bash
   npm run ai:start          # Starts all services including Ollama
   npm run ai:pull:deepseek  # Download the AI model
   npm run ai:test           # Verify everything works
   ```

2. **Daily development:**

   ```bash
   npm run dev              # Regular development (no AI)
   # OR
   npm run ai:start         # Development with AI NPCs enabled
   ```

3. **Debugging AI issues:**
   ```bash
   npm run ai:logs          # Check Ollama container logs
   npm run ai:models        # Verify models are installed
   npm run ai:test          # Run integration tests
   ```

## Environment Variables

The AI system uses these environment variables (set in docker-compose.yml):

- `OLLAMA_BASE_URL=http://ollama:11434` - Ollama service endpoint
- `OLLAMA_DEFAULT_MODEL=deepseek-r1:7b` - Default model for AI agents

## Troubleshooting

**"Connection refused" errors:**

```bash
npm run ai:docker        # Make sure Ollama container is running
npm run ai:logs          # Check for startup errors
```

**"Model not found" errors:**

```bash
npm run ai:models        # Check what models are available
npm run ai:pull:deepseek # Download the default model
```

**High memory usage:**

- DeepSeek-R1 7B needs ~8GB RAM
- Try Llama 3.2 3B (4GB) or Phi-4 Mini (2.5GB) for lighter systems

## Manual Docker Commands

If you prefer direct Docker commands:

```bash
# Start Ollama
docker compose -f docker/docker-compose.yml up -d ollama

# Pull a model
docker exec -it docker-ollama-1 ollama pull deepseek-r1:7b

# List models
docker exec -it docker-ollama-1 ollama list

# Test chat directly
docker exec -it docker-ollama-1 ollama run deepseek-r1:7b "Hello!"
```
