FROM node:10.16.0

COPY package*.json ./

RUN npm install

COPY . .


EXPOSE 3000

RUN echo "${NODE_ENV}"

CMD ["npm", "run", "dev"]