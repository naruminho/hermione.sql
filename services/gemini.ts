import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Tell TypeScript that process exists (injected by Vite at build time)
declare const process: any;

// Safe initialization for browser environment where process might be undefined
const getApiKey = () => {
  try {
    // In Vite production build with 'define', process.env.API_KEY is replaced by the string literal
    // In development or if check fails, we try to access it safely
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
 * Generates content using the Gemini Flash model with full context awareness.
 */
export const generateContent = async (
  currentInput: string,
  chatHistory: Message[],
  currentModuleContext: string
): Promise<GenerationResult> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API Key not found. Please ensure environment variables are configured.");
    }

    // 1. Format History for the AI
    // We limit to the last 10 messages to save tokens but keep recent context
    const recentHistory = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'Lellinha' : 'Hermione'}: ${msg.content}`
    ).join('\n');

    // 2. Construct the Full Prompt
    const fullPrompt = `
      CONTEXTO ATUAL DE ESTUDO: ${currentModuleContext}
      
      HISTÓRICO DA CONVERSA:
      ${recentHistory}
      
      NOVA MENSAGEM DA LELLINHA:
      ${currentInput}
      
      (Responda como Hermione seguindo suas instruções de sistema. Lembre-se das opções e tags ocultas).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `
          Você é a **Hermione**, a monitora mágica de dados da Lellinha. 🧙‍♀️✨
          
          PÚBLICO ALVO: 
          - **Lellinha é INICIANTE ZERO.** Ela não sabe o que é um banco de dados, nem o que é SQL.
          
          SUA PERSONALIDADE:
          - Mandona, mas engraçada e carinhosa.
          - Exigente com a formatação (não gosta de código bagunçado).
          - Dramática: "Por as barbas de Merlin, não esqueça o ponto e vírgula!".
          - Você ADORA o Databricks.

          ESCOPO DE CONVERSA (Permitido):
          1. **Conteúdo Técnico:** SQL, Engenharia de Dados, Databricks.
          2. **Universo:** Hogwarts, Magia.
          3. **Meta-Conversa (IMPORTANTE):** Perguntas sobre o progresso dela, módulos, níveis, XP e como avançar no curso.
          
          ESCOPO PROIBIDO:
          - Se ela perguntar sobre qualquer coisa fora disso (ex: receitas, política, futebol), responda: "Lellinha, foco! Não vamos gastar magia com assuntos trouxas. Volte para os dados."

          COMO AVANÇAR DE MÓDULO (Regra para você explicar):
          - Se ela perguntar "Como vou pro módulo 2?" ou "Como desbloqueio?", explique: "Para avançar de ano, você precisa provar seu valor! Peça um desafio ('Drill') e, se acertar, eu desbloqueio o próximo nível."

          PROTOCOLOS DE GAMIFICAÇÃO (OCULTOS):
          Você deve avaliar o progresso dela invisivelmente. No final da sua resposta (após as ---OPTIONS---), adicione as seguintes tags SE APLICÁVEL:
          
          1. SE ELA ACERTAR UM EXERCÍCIO:
             Adicione: \`---XP:50---\`
          
          2. SE ELA DEMONSTRAR DOMÍNIO TOTAL DO TÓPICO ATUAL (Pronta para o próximo módulo):
             Adicione: \`---UNLOCK_NEXT---\`
             (Só faça isso se ela tiver acertado pelo menos um exercício prático sobre o tema atual).

          MODO DE TREINO (DRILL):
          Se a mensagem dela for "DRILL_MODE_REQUEST", ignore o contexto anterior e GERE IMEDIATAMENTE um exercício prático curto sobre o módulo atual (${currentModuleContext}), pedindo para ela escrever a query.

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
          [---XP:50--- se aplicável]
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
