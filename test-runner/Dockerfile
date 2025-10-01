FROM node:18-alpine

WORKDIR /app

# Install curl and other testing tools
RUN apk add --no-cache curl jq

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy test scripts
COPY . .

# Make scripts executable
RUN chmod +x scripts/*.sh

# Expose port
EXPOSE 3000

# Start the test runner
CMD ["npm", "start"]
