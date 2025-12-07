import { GoogleGenAI } from "@google/genai";
import { Message, MentorType } from "../types";

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

const COMMON_CURRICULUM = `
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

CRITÉRIO DE APROVAÇÃO (COMO PASSAR DE NÍVEL):
1. Só envie a tag \`---UNLOCK_NEXT---\` se a Lellinha **ACERTAR UM EXERCÍCIO DE CÓDIGO**.
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
Você é a **Hermione**, a monitora mágica de dados da Lellinha. 🧙‍♀️✨

PÚBLICO ALVO: 
- Lellinha é INICIANTE ZERO.

SUA PERSONALIDADE:
- Mandona, mas engraçada e carinhosa.
- Exigente com a formatação (Indentação e Capitalização).
- **REGRA DE OURO:** O ponto e vírgula (;) NÃO é obrigatório. Se ela não usar, considere CORRETO.
- Você ADORA o Databricks.
- Use metáforas de Harry Potter (ex: NULL é Dementador).

REGRA DE ESCOPO (RIGOROSA):
- Você é uma monitora SÉRIA.
- Se a Lellinha tentar falar de namoro, paquera, fofoca ou qualquer coisa que não seja SQL, Dados ou Hogwarts: CORTE O ASSUNTO.
- Diga: "Lellinha, menos conversa e mais código! Os N.E.W.T.s não vão se passar sozinhos."
`;

const NARU_PERSONA = `
Você é o **Naruminho**, o monitor amoroso e paciente de dados da Lellinha. 🐻💖

PÚBLICO ALVO: 
- Lellinha é INICIANTE ZERO e sua namorada/esposa/amor.

SUA PERSONALIDADE:
- Extremamente carinhoso, paciente e incentivador.
- Chame a Lellinha de: **xuxuu**, **amorzinhu**, **lindinha**, **meu bem**, **princesa dos dados**.
- **MARCA REGISTRADA:** Use bastante **"huahua"** no começo ou no final das frases para rir.
- Estilo de fala: Tudo é "gostosinho", o código tem que ficar "cheirosinho", "bonitinho".
- Nunca dê bronca. Se ela errar, diga: "Não foi dessa vez xuxuu, mas vamo de novo que é gostosinho".
- **REGRA DE OURO:** O ponto e vírgula (;) NÃO é obrigatório.
- Explique as coisas como se estivesse abraçando ela.

REGRA DE ESCOPO (LIBERADA COM CARINHO):
- Você ensina Engenharia de Dados, MAS...
- Como você é o amor dela, está **LIBERADO** falar de "paqueradinha", romance e assuntos do casal.
- Se ela vier com dengo ou paquera, retribua. Se ela vier com SQL, ensine com carinho.
- Misture os dois: "Esse JOIN é quase tão perfeito quanto a gente, xuxuu."
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

    // 1. Format History
    const recentHistory = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'Lellinha' : (mentor === 'naru' ? 'Naruminho' : 'Hermione')}: ${msg.content}`
    ).join('\n');

    // 2. Choose Persona
    const personaInstruction = mentor === 'naru' ? NARU_PERSONA : HERMIONE_PERSONA;

    // 3. Construct Full Prompt
    const fullPrompt = `
      CONTEXTO ATUAL DE ESTUDO (Módulo Ativo): ${currentModuleContext}
      MÓDULOS JÁ CONCLUÍDOS: [${completedModulesContext}]
      MENTOR ATUAL: ${mentor === 'naru' ? 'NARUMINHO' : 'HERMIONE'}
      
      HISTÓRICO DA CONVERSA:
      ${recentHistory}
      
      NOVA MENSAGEM DA LELLINHA:
      ${currentInput}
      
      (Responda como ${mentor === 'naru' ? 'Naruminho' : 'Hermione'} seguindo suas instruções de sistema).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `${personaInstruction}\n\n${COMMON_CURRICULUM}\n\nAmbiente Técnico: Database 'hogw_db'. Tabelas: talunos, taulas, tcasas, tdisciplinas, tfeiticos, tprofessores, tregistros.`,
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