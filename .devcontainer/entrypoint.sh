#!/bin/bash

USERNAME=user

# Function to configure .bashrc for a specific user
configure_bashrc() {
  local user_home=$(getent passwd $1 | cut -d: -f6) # Get the home directory of the user

  # Append hstr configuration if not already present in the user's .bashrc
  if ! grep -q "hstr --show-configuration" $user_home/.bashrc; then
    hstr --show-configuration >> $user_home/.bashrc
  fi

  # Append other configurations to the user's .bashrc
  echo "source /usr/share/bash-completion/completions/git" >> $user_home/.bashrc
  cat /tmp/terminal-colors-branch.sh >> $user_home/.bashrc
  # Add any other bashrc modifications here
}

configure_bashrc ${USERNAME}

exec "$@"