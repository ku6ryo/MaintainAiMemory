import { envVar } from "./EnvVarManager"
import readline from "readline"
import { QdrantClient } from "@qdrant/js-client-rest";
import { getChatCompletion, getEmbedding } from "./openai";

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const qdrant = new QdrantClient({
    url: envVar.qdrantUrl()
  })
  const indexId = await new Promise<string>((resolve) => {
    rl.question("Index ID: ", function(input) {
      resolve(input)
    })
  })
  while (true) {
    const query = await new Promise<string>((resolve) => {
      rl.question("Query: ", function(input) {
        resolve(input)
      })
    })
    const { vector } = await getEmbedding(query)
    const results = await qdrant.search(indexId, {
      vector,
      limit: 10,
    })
    console.log(results)
    const { content } = await getChatCompletion([{
      role: "system",
      content: "You will answer based on your memory.",
    }, {
      role: "user",
      content: `question: ${query}`
        + "\n\n"
        + "memory in JSON: " + JSON.stringify(results.map((r) => {
          if (!r.payload) {
            return null
          }
          return {
            id: r.id,
            content: r.payload.content,
          }
        }
      ).filter((r) => r !== null))
      + "\n\n"
      + "answer: ",
    }])
    console.log("Answer: " + content)
  }
}

main()