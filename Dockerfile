# https://hub.docker.com/_/node/
# FROM node:12
FROM electronuserland/builder

WORKDIR /app
# copy files
COPY work_crawler.updater.js /app
RUN ["node", "work_crawler.updater.js"]

EXPOSE 80

CMD ["sh", "-c", "cd work_crawler-master && sh start_gui_electron.sh"]

# docker build .
# docker image ls
# docker tag {DOCKER_IMAGE_ID} kanasimi/work_crawler:2.1.0
# docker push kanasimi/work_crawler
