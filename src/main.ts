import readline from "readline/promises"
import { randomUUID } from "crypto"
import { MemoryManager } from "./MemoryManager"
import { validate } from "uuid"

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const mm = await (async () => {
    const idInput = (await rl.question("ID to use: ")).trim()
    if (!validate(idInput)) {
      throw new Error("Invalid ID.")
    }
    if (idInput) {
      return new MemoryManager(idInput)
    } else {
      const id = randomUUID()
      const mm = new MemoryManager(id)
      await mm.prepare()
      return mm
    }
  })()
  console.log(`Index ID: ${mm.id}`)
  while (true) {
    const input = await rl.question("Input: ")
    await mm.memorize(input)
  }
}

main()