FROM sitespeedio/node:ubuntu-22-04-nodejs-20.11.1 as base

ARG USERNAME=user
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN apt-get update -y && apt-get -y install git vim htop sudo locales wget curl x11-apps ripgrep unzip xclip vim git hstr

# Setup user, timezone, locale, and other configurations
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd -s /bin/bash --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && echo "${USERNAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers \
    && echo "root:root" | chpasswd \
    && echo "$USERNAME:$USERNAME" | chpasswd \
    && ln -snf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && echo Asia/Tokyo > /etc/timezone \
    && locale-gen en_US.UTF-8

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
ENV TZ=Asia/Tokyo
ENV NVM_DIR /home/${USERNAME}/.nvm
ENV NODE_VERSION 18
ENV PATH=/home/${USERNAME}/miniconda3/bin:$PATH
ENV PATH=/home/${USERNAME}/miniconda3/condabin:$PATH
ENV DISPLAY host.docker.internal:0.0

USER ${USERNAME}


# Download and run the NVM installation script
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Add NVM to the user's bash profile
RUN echo 'export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"' >> ~/.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc


# Set the working directory to the user's home directory
WORKDIR /home/${USERNAME}

USER root
COPY entrypoint.sh /entrypoint.sh
COPY terminal-colors-branch.sh /tmp/

# # Ensure the entrypoint script is executable
RUN chmod +x /entrypoint.sh

# # Set the entrypoint to initialize the environment
ENTRYPOINT ["/entrypoint.sh", "/bin/sh", "-c"]
CMD ["bash"]

# # Be sure to use root user at the end of the dockerfile. 