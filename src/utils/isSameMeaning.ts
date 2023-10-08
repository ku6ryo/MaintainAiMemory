import { getChatCompletion } from "../openai"

export async function isSameMeaning(input1: string, input2: string) {
  const { content } = await getChatCompletion([{
    role: "system",
    content: "You will judge if two inputs are consistent in meaning. If they are consistent, you will output \"yes\". If they are not consistent, you will output \"no\".",
  }, {
    role: "user",
    content: `input 1: ${input1.replace(/\n/g, " ")}\n\ninput 2: ${input2.replace(/\n/g, " ")}\n\nAre they consistent?`,
  }])
  return content && content.toLocaleLowerCase() === "yes"
}