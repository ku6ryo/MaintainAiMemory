import "dotenv/config"

class EnvVarManager {
  static instance: EnvVarManager | null = null

  constructor() {
    if (EnvVarManager.instance) {
      throw new Error("instance already exits")
    }
    EnvVarManager.instance = this
  }

  private getVar(key: string) {
    const v = process.env[key]
    if (!v) {
      throw new Error(`${key} is undefined`)
    }
    return v
  }

  openaiApiKey() {
    return this.getVar("OPENAI_API_KEY")
  }

  slackBotToken() {
    return this.getVar("SLACK_BOT_TOKEN")
  }

  qdrantUrl() {
    return this.getVar("QDRANT_URL")
  }
}

export const envVar = new EnvVarManager()