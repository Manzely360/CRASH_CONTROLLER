# Cloud worker with remote desktop and development tools
FROM node:18-bullseye

# Install additional development tools
RUN apt-get update && apt-get install -y \
    # Remote desktop
    xfce4 \
    xfce4-goodies \
    xrdp \
    # Development tools
    python3 \
    python3-pip \
    git \
    curl \
    wget \
    vim \
    nano \
    htop \
    # Chrome DevTools dependencies
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    # Terminal tools
    tmux \
    screen \
    zsh \
    # Browser dependencies
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Install Python packages
RUN pip3 install \
    requests \
    selenium \
    beautifulsoup4 \
    pandas \
    numpy \
    flask \
    fastapi \
    uvicorn

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Set up XRDP
RUN echo "xfce4-session" > /home/playwright/.xsession
RUN chmod +x /home/playwright/.xsession

# Configure XRDP
RUN echo "[xrdp1]" >> /etc/xrdp/xrdp.ini && \
    echo "name=Remote Desktop" >> /etc/xrdp/xrdp.ini && \
    echo "lib=libvnc.so" >> /etc/xrdp/xrdp.ini && \
    echo "username=playwright" >> /etc/xrdp/xrdp.ini && \
    echo "password=playwright" >> /etc/xrdp/xrdp.ini && \
    echo "port=-1" >> /etc/xrdp/xrdp.ini

# Set environment variables
ENV NODE_ENV=production
ENV DISPLAY=:1

# Expose ports
EXPOSE 3001 3389 8080

# Create startup script
RUN echo '#!/bin/bash\n\
# Start XRDP\n\
service xrdp start\n\
\n\
# Start VNC server\n\
Xvfb :1 -screen 0 1920x1080x24 &\n\
\n\
# Start the worker\n\
npm start &\n\
\n\
# Start Python script runner\n\
python3 /app/scripts/python_runner.py &\n\
\n\
# Keep container running\n\
wait' > /app/start.sh && chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]
