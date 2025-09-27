# Use Node.js 18 Alpine
FROM node:18-slim

# Install system dependencies for sharp/libvips and common fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    python3 \
    fontconfig \
    libvips-dev \
    libcairo2-dev \
    libpango1.0-0 \
    libjpeg-dev \
    libpng-dev \
    fonts-dejavu-core \
    fonts-noto-core \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]