# Auto Bookmark Search

# How to run
- First, install docker and docker-compose
- Open vscode and open the project
- Run `reopen in container`
- After the container is ready, run `yarn install`
  - Alternatively, you can run `npm install`
- For development, you then run `yarn dev --host`
  - Check if there is a folder called `dist` in the `src` folder
- Go to `google chrome` and type `chrome://extensions/`
- Change to `developer mode`
- Click `Load unpacked` and select the `dist` folder
- You should now see the extension in the list
- You can inspect the extension by clicking `background page` and then `inspect`


# Environment variables

In development, you can set the environment variables in the `.env` file for OpenAI API key.
The `.env` file is not included in the repository, so you need to create it yourself.
- Create a `.env` file under src directory
- Add the following line: `VITE_OPENAI_API_KEY=your_openai_api_key`
- Replace `your_openai_api_key` with your actual OpenAI API key



# TODO

