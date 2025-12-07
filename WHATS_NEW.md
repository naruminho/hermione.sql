# Changelog - Jornada da Lellinha 🚀

## v3.7 - Módulo Distinct e Reset
- **Novo Módulo:** Inclusão do módulo dedicado "O Feitiço da Unicidade (DISTINCT)" no Nível 1.
- **Storage Reset:** Atualização de chave de persistência para forçar o carregamento da nova grade curricular.

## v3.6 - Boas-Vindas Dinâmicas
- **Mensagem Adaptativa:** A mensagem inicial de boas-vindas agora muda instantaneamente entre "Olá Isabella" (Hermione) e "Oii Lellinha" (Naruminho) ao alternar o mentor.

## v3.5 - Refinamento Naruminho
- **Intimidade:** Naruminho foi instruído a nunca se apresentar formalmente, agindo naturalmente como quem já conhece a Lellinha.
- **Risadas:** Adicionada a variação "hihihi" além do "huahua" para momentos mais fofos.

## v3.4 - Refinamento de Nomes
- **Hermione Formal:** Agora a Hermione trata a usuária exclusivamente como "Isabella", reforçando a rigidez acadêmica.
- **Naruminho Carinhoso:** Mantém o tratamento de "Lellinha" e apelidos carinhosos, aumentando o contraste entre as personas.

## v3.3 - Personalidade Ajustada
- **Hermione Impaciente:** Ajuste na personalidade da Hermione para ser mais pedante, impaciente e academicamente rigorosa (usando expressões como "Afff" e "É Levi-ô-sa").
- **Contraste de Monitores:** A diferença entre a rigidez da Hermione e o carinho do Naruminho agora é extrema.

## v3.1 - v3.2 - Hogwards EAD & Naru Monitor
- **Rebranding Completo:** O app agora se chama "Hogwarts EAD".
- **Sistema de Monitores:** Adicionada a opção de alternar entre "Hermione" (Rigorosa) e "Naruminho" (Carinhoso/Xuxuu).
- **Personalidade Naru:** Implementada persona que usa "huahua", chama de "amorzinhu" e é extremamente paciente.
- **Persistência de Monitor:** O app lembra qual monitor foi escolhido por último.

## v2.1 - Limpeza Visual
- **Sidebar Organizada:** Refatoração da barra lateral para agrupar módulos por Seções (Nível 1, Nível 2...) com cabeçalhos claros, removendo a repetição de texto nos cards.
- **Visual Mais Limpo:** Melhoria na legibilidade da trilha de aprendizado.

## v2.0 - O Cérebro Completo
- **Mapa Mental Total:** Injeção da ementa completa (15 módulos específicos) no prompt de sistema da IA. Agora a Hermione sabe exatamente qual é o próximo passo didático (ex: depois de `GROUP BY` vem `HAVING`) e não corre o risco de pular etapas.

## v1.9 - A Atualização da Penseira
- **Mudança de Terminologia:** Substituição de "Ano Letivo" por "Nível" para reduzir ansiedade de tempo.
- **Penseira (Histórico):** Sistema de arquivamento de conversas antigas para limpar a tela e economizar tokens, acessível via modal.
- **Drops Inteligentes:** Implementação de `minLevel`. Drops avançados (ex: Spark Lazy Eval) agora mostram "🔒 Requer Nível 5" em vez de apenas estarem bloqueados.
- **Filtro de Erros:** Mensagens de erro da API não são mais salvas no `localStorage`, evitando poluição do histórico.

## v1.8 - Gamificação e Persistência
- **Persistência de Dados:** Implementação do `localStorage` para salvar mensagens, XP e progresso mesmo fechando a aba.
- **Modo Duelo (⚔️):** Botão para gerar baterias de exercícios rápidos sobre o tema atual.
- **Vira-Tempo (⏳):** Botão de revisão espaçada que seleciona aleatoriamente tópicos de módulos já concluídos.
- **Sistema de XP:** A IA agora atribui XP oculto (`---XP:50---`) quando o usuário acerta exercícios.
- **Desbloqueio Automático:** A IA detecta domínio do conteúdo (`---UNLOCK_NEXT---`) para liberar o próximo módulo na sidebar.

## v1.7 - A Blindagem Híbrida
- **Fix Crítico de API:** Implementação de lógica `try-catch` no acesso à `API_KEY` para suportar tanto o ambiente de Build (Vercel) quanto Runtime (Navegador).
- **Indicador Visual:** Cabeçalho da Sidebar na cor Azul.

## v1.5 - O Currículo Hogwarts
- **Grade Curricular:** Expansão de 5 tópicos genéricos para 15 módulos estruturados em 5 Níveis de Engenharia de Dados.
- **Drops de Conhecimento:** Expansão da lista de "Sapos de Chocolate" com conceitos técnicos reais (Nulls, Partitioning, Parquet).

## v1.0 - v1.4 - O Início (MVP)
- **Persona:** Definição da "Hermione" (Mandona, Didática, Databricks-lover).
- **Interface:** Sidebar responsiva, Área de Chat, Visualizador de Schema (Hogwarts DB).
- **Setup:** Configuração do Vite, Tailwind e Google Gemini Flash 2.5.