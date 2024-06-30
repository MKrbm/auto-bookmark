#!/bin/bash
VERSION="latest"

# Initialize PUSH_FLAG to false
PUSH_FLAG=false

# Check for arguments
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <username> [--push]"
    exit 1
fi

# Parse arguments
for arg in "$@"
do
    case $arg in
        --push)
        PUSH_FLAG=true
        shift # Remove --push from processing
        ;;
        *)
        USERNAME="$arg"
        ;;
    esac
done

if [ -z "$USERNAME" ]; then
    echo "Username is required."
    exit 1
fi

PARENT_FOLDER_NAME=$(basename "$(dirname "$(realpath "$0")")")

# Construct the tag name
TAG_NAME="${USERNAME}/${PARENT_FOLDER_NAME}:${VERSION}"
cd "$(dirname "$0")" || exit

docker build -t "${TAG_NAME}" .

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "Docker image built successfully: ${TAG_NAME}"
else
    echo "Docker build failed"
    exit 1
fi

# Push the Docker image to Docker Hub if --push flag is set
if $PUSH_FLAG; then
    docker push "${TAG_NAME}"

    # Check if the push was successful
    if [ $? -eq 0 ]; then
        echo "Docker image pushed successfully: ${TAG_NAME}"
    else
        echo "Docker push failed"
        exit 1
    fi
fi