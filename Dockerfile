FROM node:20

LABEL vendor="Onify"
LABEL code="nodejs"

WORKDIR /usr/src/app

COPY ./package-lock.json ./
COPY ./package.json ./
COPY ./app.js ./

COPY ./src ./src
COPY ./test ./test
COPY ./custom ./custom

RUN find . -name 'package.json' -not -path '**/node_modules/*' -execdir npm ci \;

RUN npm prune --production

ENV NODE_ENV=production

CMD [ "npm", "start", "--silent" ]