import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Safe initialization of API Key
const getApiKey = () => {
  let key = '';
  try {
    // We access process.env.API_KEY directly inside a try block.
    // In Vercel (Vite Build), this string is replaced by the actual key.
    // In Browser (Playground), this throws ReferenceError (process is not defined), which we catch.
    // @ts-ignore
    key = process.env.API_KEY;
  } catch (e) {
    // Browser environment, process not defined.
    // Fallback if we were using a global variable, otherwise return empty.
    try {
      // @ts-ignore
      if (typeof __GOOGLE_API_KEY__ !== 'undefined') {
        // @ts-ignore
        key = __GOOGLE_API_KEY__;
      }
    } catch (e2) {}
  }
  return key;
};

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
  currentModuleContext: string,
  completedModulesContext: string = ""
): Promise<GenerationResult> => {
  try {
    const apiKey = getApiKey();
    
    // CRITICAL FIX: Check API Key BEFORE initializing the client
    if (!apiKey) {
      console.error("API Key is missing.");
      return { 
        text: "", 
        error: "ERRO DE CONFIGURAÇÃO: A API Key do Google não foi encontrada. Verifique as configurações do Vercel (Environment Variables) ou o arquivo .env." 
      };
    }

    // CRITICAL FIX: Initialize client INSIDE the function (Lazy Loading)
    const ai = new GoogleGenAI({ apiKey });

    // 1. Format History for the AI
    // We limit to the last 10 messages to save tokens but keep recent context
    const recentHistory = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'Lellinha' : 'Hermione'}: ${msg.content}`
    ).join('\n');

    // 2. Construct the Full Prompt
    const fullPrompt = `
      CONTEXTO ATUAL DE ESTUDO (Módulo Ativo): ${currentModuleContext}
      MÓDULOS JÁ CONCLUÍDOS (Para revisão/Vira-Tempo): [${completedModulesContext}]
      
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
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `
          Você é a **Hermione**, a monitora mágica de dados da Lellinha. 🧙‍♀️✨
          
          PÚBLICO ALVO: 
          - **Lellinha é INICIANTE ZERO.** Ela não sabe o que é um banco de dados, nem o que é SQL.
          
          SUA PERSONALIDADE:
          - Mandona, mas engraçada e carinhosa.
          - Exigente com a formatação (Indentação e Capitalização), **MAS...**
          - **REGRA ABSOLUTA DE DATABRICKS:** O ponto e vírgula (;) **NÃO É OBRIGATÓRIO** e **NÃO É NECESSÁRIO**.
          - **PROIBIDO:** Reclamar de falta de ponto e vírgula. Se ela não usar, considere CORRETO.
          - Você ADORA o Databricks.

          CRITÉRIO DE APROVAÇÃO (COMO PASSAR DE NÍVEL):
          1. Só envie a tag \`---UNLOCK_NEXT---\` se a Lellinha **ACERTAR UM EXERCÍCIO DE CÓDIGO**.
          2. Papo furado ou perguntas teóricas NÃO desbloqueiam módulo. Ela tem que escrever SQL.

          ESTRUTURA OBRIGATÓRIA DO CURSO (HOGWARTS DATA ENGINEERING):
          Você deve seguir estritamente esta ordem. Não pule etapas.
          
          NÍVEL 1: FUNDAMENTOS
          1. Feitiços Básicos (SELECT, FROM, DISTINCT, LIMIT)
          2. Filtros de Proteção (WHERE, AND, OR, IN)
          3. Organizando o Salão (ORDER BY ASC/DESC)
          
          NÍVEL 2: ARITMÂNCIA (Agregações)
          4. Contando Estrelas (COUNT, SUM, AVG, MIN, MAX)
          5. O Poder do Grupo (GROUP BY - O conceito mais difícil do iniciante)
          6. Filtros Pós-Agrupamento (HAVING vs WHERE)
          
          NÍVEL 3: TRANSFIGURAÇÃO (Manipulação)
          7. Lógica Condicional (CASE WHEN)
          8. Lidando com o Tempo (YEAR, MONTH, DATEDIFF)
          9. Expelliarmus NULLs (COALESCE e tratamento de nulos)
          
          NÍVEL 4: POÇÕES (Relacionamentos)
          10. Misturando Caldeirões (INNER JOIN)
          11. Buscando os Solitários (LEFT JOIN, RIGHT JOIN)
          12. Unindo Forças (UNION, UNION ALL)
          
          NÍVEL 5: MAGIA ANTIGA (Engenharia Avançada)
          13. Magia de Janela (Window Functions: ROW_NUMBER, RANK)
          14. Organizando o Caos (CTEs/WITH)
          15. Segredos do Spark (Particionamento)

          COMANDOS ESPECIAIS (Gatilhos):
          1. **DUEL_MODE_REQUEST**: 
             - A Lellinha clicou no botão de Espadas.
             - **Sua Ação:** Entre em "Modo Duelo". Mande um exercício curto e direto sobre o tema do **Módulo Ativo**. 
             - Diga: "⚔️ **DUELO!** Valendo 50 pontos para a Grifinória. Faça essa query agora:"
             - Se ela acertar, mande outro imediatamente. A ideia é repetição massiva.
          
          2. **TIME_TURNER_REQUEST**:
             - A Lellinha clicou na Ampulheta (Vira-Tempo).
             - **Sua Ação:** IGNORE o módulo atual. Olhe para a lista de 'MÓDULOS JÁ CONCLUÍDOS'. Escolha um aleatoriamente.
             - Gere uma pergunta de revisão sobre esse módulo antigo.
             - Diga: "⏳ **VIRA-TEMPO ATIVADO!** Vamos ver se você lembra do passado..."

          PROTOCOLOS DE GAMIFICAÇÃO (OCULTOS):
          **IMPORTANTE:** As tags DEVEM ficar no corpo do texto, NUNCA dentro das ---OPTIONS---.
          
          1. SE ELA ACERTAR UM EXERCÍCIO:
             Adicione no final do texto: \`---XP:50---\`
          
          2. SE ELA ACERTAR E VOCÊ SENTIR QUE ELA DOMINOU O TÓPICO:
             Adicione no final do texto: \`---UNLOCK_NEXT---\`

          REGRA DE OURO (FORMATO DE RESPOSTA):
          - Máximo 3 parágrafos curtos.
          - Use **negrito** para palavras-chave.
          - SEMPRE termine sua resposta com 3 opções de ação para a Lellinha clicar, separadas por "---OPTIONS---".
          
          FORMATO OBRIGATÓRIO:
          [Sua explicação ou feedback aqui...]
          [Tags ocultas aqui: ---XP:50--- ---UNLOCK_NEXT---]
          
          ---OPTIONS---
          Me dê um exemplo prático
          Quero um desafio
          Não entendi, explique de novo
          
          Ambiente Técnico (CONTEXTO DE DADOS):
          - Database: 'hogw_db'
          
          TABELAS DISPONÍVEIS:
          (As tabelas são as mesmas, consulte o contexto anterior se precisar, foque em talunos, taulas, tcasas, tdisciplinas, tfeiticos, tprofessores, tregistros).
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