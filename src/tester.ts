import { randomUUID } from "crypto"
import { MemoryManager } from "./MemoryManager"
import { readFile } from "fs/promises"
import path from "path"
import { isSameMeaning } from "./utils/isSameMeaning"

async function main() {
  const id = randomUUID()
  console.log(`Memory ID: ${id}`)
  const memoryManager = new MemoryManager(id)
  await memoryManager.prepare()

  const lines = (await readFile(path.join(__dirname, "./data/input.txt"), "utf-8")).toString().split("\n")
  for (let line of lines) {
    if (line) {
      await memoryManager.memorize(line)
    }
  } 
  const cases = [{
    input: "how old is Ryo?",
    expected: "Ryo is 35 years old."
  }, {
    input: "What is BOSO Tokyo's twitter account?",
    expected: "https://twitter.com/BosoTokyo",
  }, {
    input: "What is Neo tokyo punks?",
    expected: "Neo Tokyo Punks is a NFT project."
  }, {
    input: "What is Ryo working on now?",
    expected: "Ryo is working on AR"
  }, {
    input: "Where does Ryo live?",
    expected: "Ryo lives in Tokyo."
  }]

  let correct = 0
  for (let { input, expected } of cases) {
    const answer = await memoryManager.ask(input)
    const isConsistent = await isSameMeaning(expected, answer)
    correct += isConsistent ? 1 : 0
    if (!isConsistent) {
      console.log(`Input: ${input}`)
      console.log(`Expected: ${expected}`)
      console.log(`Answer: ${answer}`)
    }
  }
  console.log(`Accuracy: ${(correct / cases.length * 100).toFixed(2)}%`)
}
main()