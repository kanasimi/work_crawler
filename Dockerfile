# https://hub.docker.com/r/kanasimi/work_crawler

# https://www.jinnsblog.com/2018/12/docker-dockerfile-guide.html
# https://nodejs.org/zh-cn/docs/guides/nodejs-docker-webapp/
# https://ithelp.ithome.com.tw/articles/10192519
# https://www.electron.build/multi-platform-build#docker

# https://github.com/nodejs/docker-node
# https://hub.docker.com/_/node/
# https://derickbailey.com/2017/03/09/selecting-a-node-js-image-for-docker/
FROM node:12
# FROM electronuserland/builder

# Create app directory
WORKDIR /app
# copy files
COPY work_crawler.updater.js /app
RUN ["node", "work_crawler.updater.js"]

# application's default port
EXPOSE 80

CMD ["sh", "-c", "cd work_crawler-master && sh start_gui_electron.sh"]

# docker build .
# docker image ls
# docker tag {DOCKER_IMAGE_ID} kanasimi/work_crawler:2.1.0
# docker push kanasimi/work_crawler

# docker pull kanasimi/work_crawler
# docker run -it --rm --name kanasimi/work_crawler
# Enter the container
# docker exec -it kanasimi/work_crawler /bin/bash

