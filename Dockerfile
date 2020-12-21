FROM node:14-alpine
WORKDIR /usr/src/krist

# Install packages
COPY package*.json ./
RUN npm install

# Install source
COPY . .

# Run Krist
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "index.js"]
