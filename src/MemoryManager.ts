import { envVar } from "./EnvVarManager"
import { randomUUID } from "crypto"
import { QdrantClient } from "@qdrant/js-client-rest"
import { getChatCompletion, getEmbedding } from "./openai"


export class MemoryManager {
  id: string
  qdrant: QdrantClient

  constructor(
    id: string,
  ) {
    this.id = id
    this.qdrant = new QdrantClient({
      url: envVar.qdrantUrl()
    })
  }

  async prepare() {
    // Check if collection exists. If not, create it.
    try {
      await this.qdrant.getCollection(this.id)
    } catch (e) {
      if (typeof e === "object" && e && "status" in e && e.status === 404) {
        await this.createCollection()
      } else {
        throw e
      }
    }
  }

  private async createCollection() {
    await this.qdrant.createCollection(this.id, {
      vectors: {
        size: 1536,
        distance: "Cosine",
      }
    })
  }

  async memorize(content: string) {
    const memories = await this.search(content, 10)
    let prompt = "Please output actions to maintain memories in JSON."
    prompt += "Keep information as much as possible and maintain as latest as possible."
    prompt += "Please leave as it is if you find memories which context is not similar to the input."
    prompt += "Please unify / merge memories if you find similar memories."
    prompt += "Please be casefull to modify or remove memories and make sure you modify or remove if you really need to do so. e.g. too old, too irrelevant, etc."
    prompt += "If input has misspellings, please correct them."
    prompt += "If input has grammatical errors, please correct them."
    prompt += "If input has too long sentences unnecessarily, please shorten them."
    prompt += "Your output should be a JSON array of objects. Even if you have only one action, you should output an array of one object."
    prompt += "If you think you should do nothing, please output an empty JSON array []"
    prompt += "\n\n"
    prompt += `Input: ${content}\n\n`
    prompt += "Here are memories in similar context which you previously stored in JSON:\n\n"
    prompt += JSON.stringify(memories)
    prompt += "\n\n"
    prompt += "Action JSON: "
    const { content: completion } = await getChatCompletion([{
      role: "system",
      content: "You are maintaining your memories. You are an AI and have a external memory storage.\n"
        + "Memory spec:\n"
        + "- A memory is stored as a single sentence and stored as a record.\n"
        + "- Each memory has a unique ID.\n"
        + "- Memories are stored with a vector representation and can be searched.\n"
        + "- Actions to maintain memories are \"add\", \"modify\" and \"remove\".\n"
        + "- To write, update and delete, you need to output JSON.\n"
        + `[{ "action": "remove", "id": "12345678-1234-1234-1234-123456789012" }, { "action": "add", "content": "This is a new memory." }, { "action": "modify", "id": "12345678-1234-1234-1234-123456789012", "content": "This is a modified memory." }]\n`
        + "- For \"remove\" action, output the ID of the memory.\n"
        + "- For \"add\" action, output a sentence.\n"
        + "- For \"modify\" action, output the ID of the memory to modify and a sentence for the updated memory.\n"
        + "- Please keep duplicated memories as less as possible.\n"
        + "\n"
    }, {
      role: "user",
      content: prompt,
    }])
    if (completion) {
      const actions = JSON.parse(completion)
      console.log(actions)
      for (let action of actions) {
        if (action.action === "remove") {
          console.log(memories.find(m => m.id === action.id))
          await this.qdrant.delete(this.id, {
            points: [action.id],
          })
        } else if (action.action === "add") {
          const vec = await getEmbedding(action.content)
          await this.qdrant.upsert(this.id, {
            wait: true,
            points: [{
              id: randomUUID(),
              vector: vec.vector,
              payload: {
                content: action.content,
              }
            }]
          })
        } else if (action.action === "modify") {
          const vec = await getEmbedding(action.content)
          console.log(memories.find(m => m.id === action.id))
          await this.qdrant.upsert(this.id, {
            wait: true,
            points: [{
              id: action.id,
              vector: vec.vector,
              payload: {
                content: action.content,
              }
            }],
          })
        }
      }
    }
  }

  async search(query: string, limit: 10) { 
    const { vector } = await getEmbedding(query)
    const results = await this.qdrant.search(this.id, {
      vector,
      limit,
    })
    return results.map((r) => {
      if (!r.payload) {
        return null
      }
      return {
        id: r.id,
        content: r.payload.content,
      }
    }
    ).filter((r) => r !== null) as { id: string, content: string }[]
  }

  async ask(query: string) {
    const memories = this.search(query, 10)
    const { content } = await getChatCompletion([{
      role: "system",
      content: "You will answer based on your memory.",
    }, {
      role: "user",
      content: `question: ${query}`
        + "\n\n"
        + "memory in JSON: " + JSON.stringify(memories)
        + "\n\n"
        + "answer: ",
    }])
    return content || "Sorry, I don't know."
  }
}