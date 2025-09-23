FROM browserless/chrome:latest

WORKDIR /app

COPY package.json ./
COPY monitor.js ./

RUN npm install

CMD ["node", "monitor.js"]

