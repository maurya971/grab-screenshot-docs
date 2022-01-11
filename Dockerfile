FROM node:8.11-alpine as base

# Add package file
COPY package.json ./

# Install deps
RUN npm i


# Copy source
COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY tsoa.json ./tsoa.json

# Build dist
RUN npm run build:routes
RUN npm run build:swagger
RUN npm run build

# Start production image build
FROM node:12-alpine

# Copy node modules and build directory
COPY --from=base ./node_modules ./node_modules
COPY --from=base /dist /dist
COPY --from=base ./api/swagger.json /dist/swagger.json

# Adding ffmpeg
RUN apk add  --no-cache ffmpeg

# Expose port 3000
EXPOSE 3000
CMD ["dist/main.js"]
