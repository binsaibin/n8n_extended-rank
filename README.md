# TextRank Summarization with n8n and Language Services

A modular system for text summarization using the TextRank algorithm with separate Korean and English language preprocessing services.

## Project Overview

This project provides a solution for text summarization with the following features:

- **Multi-language Support**: Korean and English text processing
- **Modular Architecture**: Separate services for language processing
- **Extended TextRank**: Implements TextRank with dynamic damping factors
- **Containerized**: Docker-based deployment for easy setup and scaling

## Architecture

The system consists of the following components:

1. **n8n**: Workflow orchestration engine with node-summarizer integration
2. **kiwi-service**: Korean language processing service
3. **wink-service**: English language processing service
4. **TextRank Bridge**: JavaScript module to connect language services with node-summarizer

## Directory Structure

```
custom-n8n/
├── config/                  # Configuration files
│   ├── docker-compose.yml   # Docker service definitions
│   ├── nginx.conf           # NGINX reverse proxy config
├── docker/                  # Docker build files
│   ├── kiwi/                # Korean service Dockerfile
│   ├── n8n/                 # n8n Dockerfile
│   ├── wink/                # English service Dockerfile
├── src/                     # Source code
│   ├── kiwi-service/        # Korean text processing service
│   ├── kiwi-addon/          # C++ addon for Korean text analysis
│   ├── wink-service/        # English text processing service
│   ├── summarization/       # TextRank integration
│   │   ├── textrank-bridge.js      # Bridge between services and node-summarizer
│   │   ├── n8n-textrank-node-example.js # Example n8n code node
├── scripts/                 # Utility scripts
└── .env                     # Environment variables
```

## Services

### kiwi-service

A Korean language processing service that provides:

- **Morphological Analysis**: Analyze Korean text
- **Sentence Splitting**: Split text into sentences
- **Tokenization**: Break text into tokens
- **TextRank Preprocessing**: Preparation for TextRank algorithm

### wink-service

An English language processing service that provides:

- **Sentence Splitting**: Split text into sentences
- **Text Normalization**: Normalize text for analysis
- **Tokenization**: Break text into tokens
- **POS Tagging**: Tag words with parts of speech
- **TextRank Preprocessing**: Preparation for TextRank algorithm

### TextRank Bridge

A JavaScript module that:

- Detects the language of input text
- Routes text to the appropriate language service
- Applies dynamic damping factors for TextRank
- Integrates with node-summarizer

## Setup and Usage

### Prerequisites

- Docker and Docker Compose
- Node.js 14+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/custom-n8n.git
   cd custom-n8n
   ```

2. Create n8n data volume:
   ```bash
   docker volume create n8n_data
   ```

3. Start the services:
   ```bash
   docker-compose -f config/docker-compose.yml up -d
   ```

### Using in n8n

1. Open n8n at http://localhost:5678 (or your configured domain)
2. Create a new workflow
3. Add a "Code" node
4. Copy the code from `src/summarization/n8n-textrank-node-example.js`
5. Connect to nodes that provide text input
6. Execute and get your summary!

### API Endpoints

#### kiwi-service (Korean)

- `POST /morpheme`: Morphological analysis
- `POST /sentence-split`: Split text into sentences
- `POST /tokenize`: Tokenize text
- `POST /preprocess`: Basic preprocessing
- `POST /preprocess-for-textrank`: TextRank-optimized preprocessing

#### wink-service (English)

- `POST /sentence-split`: Split text into sentences
- `POST /normalize`: Normalize text
- `POST /tokenize`: Tokenize text
- `POST /pos`: Part-of-speech tagging
- `POST /preprocess-for-textrank`: TextRank-optimized preprocessing

## TextRank Algorithm

The implemented TextRank algorithm includes the following enhancements:

1. **Dynamic Damping Factor**: Automatically adjusts based on:
   - Text length
   - Topic diversity
   - Sentence connectivity

2. **Optimized Preprocessing**:
   - Language-specific stopword removal
   - POS tag filtering
   - Key term extraction

## Contributing

Contributions are welcome! Please follow the coding principles:

- Add header comments explaining each code block's purpose
- Structure code in independent, modular components
- Separate business logic from utility functions
- Use intuitive function and variable names
- Add proper error handling

## License

This project is licensed under the MIT License - see the LICENSE file for details. 