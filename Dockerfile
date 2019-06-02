FROM node:12

WORKDIR /work_crawler
# copy files
COPY . /work_crawler
RUN ["node", "work_crawler.updater.js"]

EXPOSE 80

CMD ["sh", "start_gui_electron.sh"]

# docker build .
# docker image ls
# docker tag {DOCKER_IMAGE_ID} kanasimi/work_crawler:2.1.0
# docker push kanasimi/work_crawler
