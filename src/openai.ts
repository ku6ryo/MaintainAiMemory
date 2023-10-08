import { ChatCompletionFunctions, Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai"
import { envVar } from "./EnvVarManager"

export async function getEmbedding(text: string) {
  const openai = new OpenAIApi(new Configuration({ apiKey: envVar.openaiApiKey() }))
  const { data: { data, usage } } = await openai.createEmbedding({
    model: "text-embedding-ada-002", 
    input: text,
  })
  return {
    vector: data[0].embedding,
    tokens: usage.total_tokens,
  }
}

export async function getChatCompletion(messages: ChatCompletionRequestMessage[]) {
  const openai = new OpenAIApi(new Configuration({ apiKey: envVar.openaiApiKey() }))
  const { data: { choices, usage } } = await openai.createChatCompletion({
    model: "gpt-4",// "gpt-3.5-turbo-16k-0613",
    messages,
  })
  if (!usage) {
    throw new Error("usage is null")
  }
  if (choices.length === 0 || !choices[0].message) {
    throw new Error("choices is empty")
  }
  return {
    tokens: usage.total_tokens,
    content: choices[0].message.content,
  }
}

export async function getChatCompletionWithFuncs(messages: ChatCompletionRequestMessage[], functions: ChatCompletionFunctions[]) {
  const openai = new OpenAIApi(new Configuration({ apiKey: envVar.openaiApiKey() }))
  const { data: { choices, usage } } = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    messages,
    functions,
  })
  if (!usage) {
    throw new Error("usage is null")
  }
  if (choices.length === 0 || !choices[0].message) {
    throw new Error("choices is empty")
  }
  return {
    tokens: usage.total_tokens,
    content: choices[0].message.content,
    functionCall: choices[0].message.function_call || null,
  }
}