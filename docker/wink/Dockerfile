FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY src/wink-service/package*.json ./
RUN npm install

# Copy service files
COPY src/wink-service/wink-service.js .
COPY src/wink-service/wink-textrank-endpoint.js .

# Install additional dependencies
RUN npm install wink-nlp wink-eng-lite-web-model cors express

EXPOSE 3001
CMD ["node", "wink-service.js"]