# Logging Server

This is a simple log streaming server built with FastAPI and WebSockets. It streams log files to connected clients in real-time and receives error reports from the frontend.

## Setup

1. Install dependencies:
   ```bash
   pip install -e .
   ```

2. Create a `.env` file in the `logging-server` directory with the following content:
   ```
   LOGGING_SECRET_KEY=your-secret-key-here
   ```
   Replace `your-secret-key-here` with a secure secret key.

3. Start the logging server:
   ```bash
   python logging-server.py
   ```

The server will run on `http://localhost:9000`.

## Usage

- The server streams logs from files in the `../logs` directory.
- It accepts POST requests at `/` for error reports from the frontend.
- WebSocket connections at `/` allow clients to subscribe to log streams.

## Integration

The frontend (in the `app` directory) uses this server to send error logs when they occur during development. Ensure the logging server is running before starting the frontend dev server with `pnpm dev`.