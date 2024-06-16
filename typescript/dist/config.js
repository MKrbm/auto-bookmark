import dotenv from 'dotenv';
// 環境変数の読み込み
dotenv.config();
dotenv.config({ path: 'public.env' });
export const config = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
    LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
    LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
    LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
};
