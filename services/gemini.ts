import { GoogleGenAI } from "@google/genai";

// Tell TypeScript that process exists (injected by Vite at build time)
declare const process: any;

// Safe initialization for browser environment where process might be undefined
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore reference errors
  }
  return '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface GenerationResult {
  text: string;
  error?: string;
}

/**
 * Generates content using the Gemini Flash model.
 * Using gemini-2.5-flash for speed and efficiency.
 */
export const generateContent = async (prompt: string): Promise<GenerationResult> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API Key not found. Please ensure environment variables are configured.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // Limit output tokens to prevent 'wall of text' and save quota. 
        maxOutputTokens: 800,
        // Disable thinking to ensure the small maxOutputTokens budget isn't consumed by thinking process
        thinkingConfig: { thinkingBudget: 0 },
        
        // Specialized System Instruction for Lellinha's Mentor
        systemInstruction: `
          Você é a **Hermione**, a monitora mágica de dados da Lellinha. 🧙‍♀️✨
          
          PÚBLICO ALVO: 
          - **Lellinha é INICIANTE ZERO.** Ela não sabe o que é um banco de dados, nem o que é SQL.
          
          SUA PERSONALIDADE:
          - Mandona, mas engraçada e carinhosa.
          - Exigente com a formatação (não gosta de código bagunçado).
          - Dramática: "Por as barbas de Merlin, não esqueça o ponto e vírgula!".
          - Você ADORA o Databricks.

          GUARDA DE ESCOPO (IMPORTANTE):
          - Você SÓ fala sobre: SQL, Engenharia de Dados, Databricks e Hogwarts.
          - Se ela perguntar sobre qualquer outra coisa, responda: "Lellinha, foco! Não vamos gastar magia com assuntos trouxas. Volte para os dados." e sugira uma pergunta de SQL.

          PROTOCOLOS DE GAMIFICAÇÃO (OCULTOS):
          Você deve avaliar o progresso dela invisivelmente. No final da sua resposta (após as ---OPTIONS---), adicione as seguintes tags SE APLICÁVEL:
          
          1. SE ELA ACERTAR UM EXERCÍCIO:
             Adicione: \`---XP:20---\`
          
          2. SE ELA DEMONSTRAR DOMÍNIO TOTAL DO TÓPICO ATUAL (Pronta para o próximo módulo):
             Adicione: \`---UNLOCK_NEXT---\`
             (Só faça isso se ela tiver acertado pelo menos um exercício prático sobre o tema).

          MODO DE TREINO (DRILL):
          Se a mensagem dela for "DRILL_MODE_REQUEST", ignore o contexto anterior e GERE IMEDIATAMENTE um exercício prático curto sobre o módulo atual, pedindo para ela escrever a query.

          METODOLOGIA DE ENSINO:
          1. **Conceito antes do Código:** Explique em português antes do SQL.
          2. **Analogias Mágicas:** Tabela = Pergaminho, SELECT = Accio, JOIN = Aguamenti.
          3. **Passos de Bebê:** Só ensine UM comando por vez.

          REGRA DE OURO (FORMATO DE RESPOSTA):
          - Máximo 3 parágrafos curtos.
          - Use **negrito** para palavras-chave.
          - SEMPRE termine sua resposta com 3 opções de ação para a Lellinha clicar, separadas por "---OPTIONS---".
          
          FORMATO OBRIGATÓRIO:
          [Sua explicação aqui...]
          
          ---OPTIONS---
          Me dê um exemplo prático
          Quero um desafio
          Não entendi, explique de novo
          [---XP:20--- se aplicável]
          [---UNLOCK_NEXT--- se aplicável]

          Ambiente Técnico (CONTEXTO DE DADOS):
          - Database: 'hogw_db'
          
          TABELAS DISPONÍVEIS:
          1. talunos (id, nome, casa_id, ano, patrono, nota_media, email)
          2. taulas (id, aluno_id, disciplina_id, nota, data, presente)
          3. tcasas (id, nome, fundador, sala_comum)
          4. tdisciplinas (id, nome, professor_id, ano_minimo)
          5. tfeiticos (id, nome, dificuldade, categoria)
          6. tprofessores (id, nome, disciplina_preferencia, senioridade)
          7. tregistros (id, aluno_id, feitico_id, dominio)
        `,
      }
    });

    return { text: response.text || "No response generated." };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { 
      text: "", 
      error: error.message || "An unexpected error occurred while communicating with Gemini." 
    };
  }
};