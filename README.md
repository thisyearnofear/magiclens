# MagicLens - Augmented Reality Video Platform

MagicLens is a web-based platform that allows users to add augmented reality overlays to their videos. It features a React-based frontend with Web3 authentication, a Python backend with a microservices architecture, and a dedicated logging server.

## Features

- **Web3 Authentication:** Decentralized authentication using blockchain wallets
- **Video and Asset Management:** Upload, browse, and manage videos and AR assets
- **Augmented Reality Editor:** A canvas-based editor for adding, positioning, and timing AR overlays on videos
- **Interactive Controls:** Drag, resize, and rotate overlays directly on the video
- **Collaboration:** A collaborative workspace for artists and videographers
- **AI-Powered Recommendations:** Get smart recommendations for AR overlays

## Getting Started

### Prerequisites

- Node.js and pnpm
- Python 3.11+ and pip
- Web3 wallet (MetaMask, WalletConnect, etc.) for authentication

### Frontend Setup

1.  Navigate to the `app` directory:
    ```bash
    cd app
    ```
2.  Install the dependencies:
    ```bash
    pnpm install
    ```
3.  Run the development server:
    ```bash
    pnpm run dev
    ```

### Backend Setup

1.  Navigate to the `services` directory:
    ```bash
    cd services
    ```
2.  Install the Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the backend server:
    ```bash
    uvicorn main:app --reload
    ```

## Authentication

MagicLens uses Web3 on-chain authentication instead of traditional JWT tokens. Users authenticate by connecting their blockchain wallet (e.g., MetaMask, WalletConnect). This provides:

- **Decentralized Identity:** No centralized authentication server
- **Enhanced Security:** Cryptographic signatures for authentication
- **User Ownership:** Users maintain full control of their identity

## Core Principles

This project adheres to the following core principles:

- **ENHANCEMENT FIRST:** Always prioritize enhancing existing components over creating new ones.
- **AGGRESSIVE CONSOLIDATION:** Delete unnecessary code rather than deprecating.
- **PREVENT BLOAT:** Systematically audit and consolidate before adding new features.
- **DRY:** Single source of truth for all shared logic.
- **CLEAN:** Clear separation of concerns with explicit dependencies.
- **MODULAR:** Composable, testable, independent modules.
- **PERFORMANT:** Adaptive loading, caching, and resource optimization.
- **ORGANIZED:** Predictable file structure with domain-driven design.