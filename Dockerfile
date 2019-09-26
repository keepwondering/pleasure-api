FROM mhart/alpine-node:8
ADD . /code
WORKDIR /code
RUN apk add --no-cache git
RUN yarn --production=false
# CMD ["pls app", "start"]
