ARG N8N_VERSION=latest
FROM docker.n8n.io/n8nio/n8n:${N8N_VERSION}
USER root
# Remove NLP packages from n8n and rely on separate services instead
USER node
WORKDIR /home/node
