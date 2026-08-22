# Use Node.js as base
FROM node:18-alpine

WORKDIR /app



# Copy api app
COPY apps/api/package.json ./apps/api/
COPY apps/api/src ./apps/api/src/

# Install dependencies for api
RUN cd apps/api && npm install --production

# Expose API port
EXPOSE 3001

# Run the API server
CMD ["node", "apps/api/src/server.js"]
