FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application
COPY . .

# Build application (commented out for initial setup if no pages exist)
# RUN npm run build

# Expose port
EXPOSE 3000

# Run application
CMD ["npm", "run", "dev"]
