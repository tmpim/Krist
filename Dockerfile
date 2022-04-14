FROM node:16-alpine
WORKDIR /usr/src/krist

# Install packages
COPY package*.json ./
RUN apk add git ca-certificates
RUN npm install --legacy-peer-deps

# Install source
COPY . .

# Generate docs
RUN npm run docs

# Run Krist
EXPOSE 8080
ENV NODE_ENV=production
CMD ["npm", "start"]
