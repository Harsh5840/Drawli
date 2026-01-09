# Distributed Spatial Collaboration Engine

This repository contains the source code for the Infinite-Canvas Engine.

## Structure

- **`/backend`**: Golang WebSocket server with Quadtree spatial engine and Protobuf protocol.
- **`/frontend`**: React + PixiJS client (moved from prototype).

## Getting Started

### Backend

Prerequisites:
- Go 1.25+
- Protoc (Protobuf Compiler)
- Redis & PostgreSQL (Docker recommended)

```bash
cd backend
make proto  # Generate Protobuf code
go run ./cmd/server
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
