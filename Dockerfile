# Use Node.js 18 Alpine
FROM node:18-alpine

# Install system dependencies for Sharp and build tools
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++ \
    libc6-compat

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD [ "node", "server.js" ]