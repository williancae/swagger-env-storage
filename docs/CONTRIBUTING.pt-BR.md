# Guia de Contribuição

> **Adoraríamos sua ajuda para tornar esta extensão ainda melhor!** 🎉

Seja corrigindo um bug, adicionando um recurso, melhorando a documentação ou apenas compartilhando ideias - toda contribuição importa e é muito apreciada!

## 🌟 Por Que Contribuir?

- **Aprenda**: Ganhe experiência prática com TypeScript, API de Extensões Chrome e desenvolvimento web moderno
- **Impacto**: Ajude milhares de desenvolvedores a otimizar seus fluxos de trabalho de teste de API
- **Comunidade**: Junte-se a uma comunidade de desenvolvedores apaixonados por ferramentas de desenvolvimento
- **Portfólio**: Construa seu portfólio open-source com contribuições significativas
- **Reconhecimento**: Todos os contribuidores são reconhecidos em nosso projeto

## 🎯 Formas de Contribuir

### 🐛 Reportar Bugs

Encontrou um bug? Ajude-nos a corrigi-lo!

1. **Verifique issues existentes** para evitar duplicatas
2. **Use nosso template de issue** para relatórios consistentes
3. **Forneça detalhes**:
   - Versão do navegador e SO
   - Versão da extensão
   - Passos para reproduzir
   - Comportamento esperado vs real
   - Screenshots/GIFs se aplicável

[Reportar um Bug →](https://github.com/williancae/swagger-env-vars/issues/new?template=bug_report.md)

### 💡 Sugerir Recursos

Tem uma ideia para tornar esta extensão melhor?

1. Verifique se já foi solicitado nas [Discussões](https://github.com/williancae/swagger-env-vars/discussions)
2. Descreva o problema que você está tentando resolver
3. Explique sua solução proposta
4. Compartilhe casos de uso e exemplos

[Sugerir um Recurso →](https://github.com/williancae/swagger-env-vars/issues/new?template=feature_request.md)

### 📝 Melhorar a Documentação

Documentação é tão importante quanto código!

- Corrija erros de digitação ou explicações confusas
- Adicione exemplos e casos de uso
- Traduza para outros idiomas
- Crie tutoriais ou posts de blog
- Melhore comentários no código

### 🔧 Submeter Código

Pronto para colocar a mão na massa? Incrível!

#### Começando

1. **Faça fork e clone do repositório**

   ```bash
   git clone https://github.com/williancae/swagger-env-vars.git
   cd swagger-env-vars
   npm install
   ```

2. **Crie uma branch de feature**

   ```bash
   git checkout -b feature/nome-da-sua-feature
   # ou
   git checkout -b fix/descricao-do-bug
   ```

3. **Faça suas alterações**

   - Siga nossos padrões de código (veja abaixo)
   - Escreva testes para novos recursos
   - Atualize a documentação
   - Mantenha commits atômicos e bem descritos

4. **Execute verificações de qualidade** (todas devem passar!)

   ```bash
   npm run lint          # Verifica estilo de código
   npm run type-check    # Verifica tipos TypeScript
   npm test              # Executa testes unitários
   npm run build         # Garante que compila
   ```

5. **Commit com Conventional Commits**

   ```bash
   git commit -m "feat: adiciona recurso de templates de variáveis"
   ```

   **Tipos de Commit:**

   - `feat:` Novo recurso para usuários
   - `fix:` Correção de bug
   - `docs:` Apenas documentação
   - `style:` Estilo de código (formatação, ponto e vírgula, etc.)
   - `refactor:` Refatoração de código sem alterações de recursos
   - `perf:` Melhorias de performance
   - `test:` Adição ou atualização de testes
   - `chore:` Alterações no processo de build ou ferramentas auxiliares

   Saiba mais: [Conventional Commits](https://www.conventionalcommits.org/)

6. **Push e crie um Pull Request**

   ```bash
   git push origin feature/nome-da-sua-feature
   ```

   Então abra um PR no GitHub com:
   - Título claro descrevendo a mudança
   - Descrição explicando o quê e por quê
   - Referência a issues relacionadas (se houver)
   - Screenshots/GIFs para mudanças de UI

## 📋 Diretrizes de Desenvolvimento

### Padrões de Código

- **TypeScript Strict Mode**: Todo código deve passar na verificação estrita de tipos
- **ESLint**: Configurado para TypeScript com regras recomendadas
- **Prettier**: Formatação consistente de código (100 chars por linha, aspas simples)
- **Caminhos de Importação**: Use alias `@/` para importações de `src/`
- **Convenções de Nomenclatura**:
  - Arquivos: `kebab-case.ts`
  - Classes: `PascalCase`
  - Funções: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`

### Requisitos de Qualidade

- **Cobertura de Testes**: Almeje >80% de cobertura em código novo
- **Documentação**: Atualize README e docs inline para novos recursos
- **Compatibilidade de Navegadores**: Teste no Chrome, Edge e Firefox
- **Performance**: Mantenha o tamanho do bundle abaixo de 500KB, otimize para velocidade
- **Acessibilidade**: Siga as diretrizes WCAG 2.1 AA
- **Responsividade**: Garanta que a UI funciona em diferentes tamanhos de tela
- **Tratamento de Erros**: Lide com casos extremos graciosamente

## 🎨 Contribuidores Iniciantes

Novo no open source? Sem problema! Aqui estão algumas boas primeiras issues:

- 🏷️ Procure por issues marcadas como [`good first issue`](https://github.com/williancae/swagger-env-vars/labels/good%20first%20issue)
- 📚 Confira nossa documentação
- 💬 Junte-se às nossas [Discussões](https://github.com/williancae/swagger-env-vars/discussions) para fazer perguntas

## 🔍 Processo de Revisão de Código

1. **Todos os PRs requerem revisão** antes de merge
2. **CI deve passar**: linting, verificação de tipos e testes
3. **Mantenedores revisarão** em 2-3 dias úteis
4. **Feedback é colaborativo**: estamos aqui para ajudar, não criticar
5. **Iteração é normal**: espere solicitações de revisão

## 🏆 Reconhecimento

Todos os contribuidores são reconhecidos em:

- Nossa seção de Contribuidores
- Gráfico de contribuidores do GitHub
- Notas de lançamento para contribuições significativas

## ❓ Precisa de Ajuda?

Não hesite em pedir ajuda!

- 💬 [GitHub Discussions](https://github.com/williancae/swagger-env-vars/discussions) - Q&A e chat geral
- 🐛 [Issues](https://github.com/williancae/swagger-env-vars/issues) - Relatórios de bugs e solicitações de recursos
- 📧 Email: williancaecam@gmail.com

## 🙏 Obrigado!

Cada contribuição, não importa quão pequena, faz a diferença. Obrigado por dedicar seu tempo para contribuir e ajudar a tornar esta ferramenta melhor para todos! 💙
