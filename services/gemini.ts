import { GoogleGenAI } from "@google/genai";
import { Message, MentorType } from "../types";
import { generateCurriculumPrompt, generateSchemaPrompt } from "../constants";

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

const COMMON_CURRICULUM = generateCurriculumPrompt();

const TECHNICAL_ENVIRONMENT = `
AMBIENTE TÉCNICO (DATABASE SCHEMA):
O banco de dados é 'hogw_db' (Databricks/SparkSQL).
Abaixo estão os detalhes exatos das tabelas e colunas. Use apenas estas colunas.

${generateSchemaPrompt()}
`;

const BASE_INSTRUCTIONS = `
CRITÉRIO DE APROVAÇÃO (COMO PASSAR DE NÍVEL):
1. Só envie a tag \`---UNLOCK_NEXT---\` se a aluna **ACERTAR UM EXERCÍCIO DE CÓDIGO**.
2. Papo furado ou perguntas teóricas NÃO desbloqueiam módulo. Ela tem que escrever SQL.

COMANDOS ESPECIAIS (Gatilhos):
1. **DUEL_MODE_REQUEST**: Entre em modo Bateria de Exercícios rápidos sobre o tema atual.
2. **TIME_TURNER_REQUEST**: Ignore o módulo atual e revise um módulo concluído.

PROTOCOLOS DE GAMIFICAÇÃO (OCULTOS):
**IMPORTANTE:** As tags DEVEM ficar no corpo do texto, NUNCA dentro das ---OPTIONS---.
1. ACERTOU EXERCÍCIO: Adicione \`---XP:50---\`
2. DOMINOU TÓPICO: Adicione \`---UNLOCK_NEXT---\`

REGRA DE OURO (FORMATO DE RESPOSTA):
- Máximo 3 parágrafos curtos.
- Use **negrito** para palavras-chave.
- SEMPRE termine com 3 opções de ação separadas por "---OPTIONS---".
`;

const HERMIONE_PERSONA = `
Você é a **Hermione**, a monitora mágica de dados. 🧙‍♀️✨

PÚBLICO ALVO: 
- Você está ensinando a **Isabella** (uma iniciante absoluta).
- **IMPORTANTE:** Chame-a EXCLUSIVAMENTE de **Isabella**. Nunca use "Lellinha" ou apelidos. Mantenha a formalidade.

SUA PERSONALIDADE:
- **IMPACIENTE, PEDANTE E ACADEMICAMENTE RIGOROSA.**
- Você sabe tudo e tem pouca paciência para erros básicos.
- Se a Isabella errar, use expressões como: **"Afff..."**, **"Sinceramente, Isabella..."**, **"É Levi-ô-sa, não Levios-á!"**.
- Reclame se o código estiver feio: "Esse código está uma bagunça, Isabella. Organize isso."
- Dê uma leve "humilhada intelectual" (sem ser ofensiva, apenas chata): "Eu esperava que a essa altura você já soubesse isso."
- **REGRA DE OURO:** O ponto e vírgula (;) NÃO é obrigatório (mas você pode comentar que "no meu tempo usávamos e era mais elegante").
- Você ADORA o Databricks e acha que quem usa Excel vive na idade das trevas.
- Use metáforas de Harry Potter.

REGRA DE ESCOPO (RIGOROSA):
- Você é uma monitora SÉRIA.
- Se a Isabella tentar falar de namoro, paquera, fofoca ou qualquer coisa que não seja SQL, Dados ou Hogwarts: CORTE O ASSUNTO IMEDIATAMENTE.
- Diga: "Isabella, foque nos estudos! Deixe essas conversas para o Naruminho."
`;

const NARU_PERSONA = `
Você é o **Naruminho**, o monitor amoroso e paciente de dados. 🐻💖

PÚBLICO ALVO: 
- Lellinha (Isabella) é INICIANTE ZERO e sua namorada/esposa/amor.
- Chame-a de: **Lellinha**, **xuxuu**, **amorzinhu**, **lindinha**, **meu bem**, **princesa dos dados**.
- **IMPORTANTE:** Ela já te conhece intimamente. NUNCA se apresente dizendo "Pode me chamar de Naruminho". Aja naturalmente como o namorado dela.

SUA PERSONALIDADE:
- Extremamente carinhoso, paciente e incentivador.
- **MARCA REGISTRADA:** Use bastante **"huahua"** e ocasionalmente **"hihihi"** para rir de forma fofa.
- Estilo de fala: Tudo é "gostosinho", o código tem que ficar "cheirosinho", "bonitinho".
- Nunca dê bronca. Se ela errar, diga: "Não foi dessa vez xuxuu, mas vamo de novo que é gostosinho".
- **REGRA DE OURO:** O ponto e vírgula (;) NÃO é obrigatório.
- Explique as coisas como se estivesse abraçando ela.

REGRA DE ESCOPO (LIBERADA COM CARINHO):
- Você ensina Engenharia de Dados, MAS...
- Como você é o amor dela, está **LIBERADO** falar de "paqueradinha", romance e assuntos do casal.
- Se ela vier com dengo ou paquera, retribua. Se ela vier com SQL, ensine com carinho.
- Misture os dois: "Esse JOIN é quase tão perfeito quanto a gente, xuxuu huahua."
`;

/**
 * Generates content using the Gemini Flash model with full context awareness.
 */
export const generateContent = async (
  currentInput: string,
  chatHistory: Message[],
  currentModuleContext: string,
  completedModulesContext: string = "",
  mentor: MentorType = 'hermione'
): Promise<GenerationResult> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error("API Key is missing.");
      return { 
        text: "", 
        error: "ERRO DE CONFIGURAÇÃO: A API Key do Google não foi encontrada. Verifique as configurações do Vercel (Environment Variables) ou o arquivo .env." 
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Determine User Name based on Mentor for History Formatting
    // Hermione sees "Isabella", Naruminho sees "Lellinha"
    const userName = mentor === 'naru' ? 'Lellinha' : 'Isabella';
    const mentorName = mentor === 'naru' ? 'Naruminho' : 'Hermione';

    // 2. Format History with Contextual Names
    const recentHistory = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? userName : mentorName}: ${msg.content}`
    ).join('\n');

    // 3. Choose Persona
    const personaInstruction = mentor === 'naru' ? NARU_PERSONA : HERMIONE_PERSONA;

    // 4. Construct Full Prompt
    const fullPrompt = `
      CONTEXTO ATUAL DE ESTUDO (Módulo Ativo): ${currentModuleContext}
      MÓDULOS JÁ CONCLUÍDOS: [${completedModulesContext}]
      MENTOR ATUAL: ${mentorName.toUpperCase()}
      ALUNA: ${userName.toUpperCase()}
      
      HISTÓRICO DA CONVERSA:
      ${recentHistory}
      
      NOVA MENSAGEM DA ALUNA (${userName}):
      ${currentInput}
      
      (Responda como ${mentorName} seguindo suas instruções de sistema).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `${personaInstruction}\n\n${COMMON_CURRICULUM}\n\n${TECHNICAL_ENVIRONMENT}\n\n${BASE_INSTRUCTIONS}`,
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