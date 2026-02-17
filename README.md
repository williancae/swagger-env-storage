# Swagger Environment Variables

Extensão de navegador para gerenciamento e substituição automática de variáveis de ambiente em formulários web, com suporte especial para Swagger UI.

## 📋 Características

- 🔄 Substituição automática de padrão `{{VARIAVEL}}` em campos de formulário
- 💾 Armazenamento persistente de variáveis (chrome.storage.local)
- 🎯 Suporte especial para Swagger UI (CodeMirror/Monaco editors)
- ⚡ Interface rápida via popup e página de opções completa
- 📦 Import/Export de variáveis em JSON
- 🔐 Type-safe com TypeScript

## 🛠️ Stack Tecnológica

- **Manifest V3** - Padrão atual de extensões
- **TypeScript** - Type safety e melhor DX
- **Web Components** - Componentes nativos sem overhead de frameworks
- **Vite** - Build ultrarrápido e HMR
- **Tailwind CSS** - Utility-first CSS
- **Vitest** - Testes unitários
- **Playwright** - Testes E2E

## 🚀 Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (watch mode com hot reload)
npm run dev

# Build para produção (otimizado e minificado)
npm run build

# Testes
npm test              # Unit tests
npm run test:watch    # Unit tests em watch mode
npm run test:e2e      # E2E tests com Playwright

# Linting e formatação
npm run lint          # Verificar código
npm run lint:fix      # Corrigir automaticamente
npm run format        # Formatar com Prettier
npm run type-check    # Verificar tipos TypeScript
```

### Build System

A extensão usa **Vite** com `vite-plugin-web-extension` para build otimizado:

**Características**:
- ⚡ Build rápido (<5s em modo dev)
- 🔥 Hot Module Replacement (HMR)
- 📦 Code splitting automático
- 🗜️ Minificação com Terser
- 📊 Bundle size: ~72KB (muito abaixo do target de 500KB)

**Entry Points**:
- `src/background/service-worker.ts` → Service Worker
- `src/content/content-script.ts` → Content Script
- `src/popup/popup.html` → Popup UI
- `src/options/options.html` → Options Page

**Output Structure** (`dist/`):
```
dist/
├── manifest.json              # Manifest processado
├── src/
│   ├── background/
│   │   └── service-worker.js  # ~11KB
│   ├── content/
│   │   └── content-script.js  # ~5KB
│   ├── popup/
│   │   └── popup.{html,js}    # ~1KB
│   └── options/
│       └── options.{html,js}  # ~4KB
├── storage.js                 # Shared storage (~5KB)
└── storage.css                # Tailwind CSS (~9KB)
```

### Carregar Extensão no Navegador

**Importante:** Sempre carregue a extensão a partir da pasta **`dist/`** (após `npm run build` ou `npm run dev`). Nunca use a raiz do projeto: o `manifest.json` da raiz referencia arquivos `.ts`, que o Chrome não executa; só o manifest gerado em `dist/` referencia os `.js` compilados.

#### Chrome/Edge

1. Abrir `chrome://extensions`
2. Habilitar "Developer mode" (canto superior direito)
3. Clicar em "Load unpacked"
4. **Selecionar a pasta `dist/`** do projeto (não a raiz)

#### Firefox

```bash
# Auto-reload durante desenvolvimento
npm run web-ext:run
```

Ou manualmente:
1. Abrir `about:debugging#/runtime/this-firefox`
2. Clicar "Load Temporary Add-on"
3. Selecionar `dist/manifest.json`

## 📁 Estrutura do Projeto

```
swagger_envs/
├── src/
│   ├── background/          # Service Worker
│   ├── content/             # Content Scripts
│   │   ├── detectors/       # Estratégias de detecção
│   │   ├── replacers/       # Lógica de substituição
│   │   └── observers/       # MutationObserver
│   ├── popup/               # Interface popup
│   ├── options/             # Página de opções
│   ├── shared/              # Código compartilhado
│   │   ├── storage.ts       # Abstração de storage
│   │   ├── types.ts         # Interfaces TypeScript
│   │   └── utils.ts         # Funções auxiliares
│   └── styles/              # Estilos globais
├── public/                  # Assets estáticos
├── tests/                   # Testes
├── dist/                    # Build output (gitignored)
└── claudedocs/             # Documentação técnica
```

## 🎯 Como Usar

### 1. Adicionar Variáveis

1. Clique no ícone da extensão
2. Acesse "Options" ou clique com botão direito → "Options"
3. Adicione variáveis no formato key-value

Exemplo:
- Key: `API_KEY`
- Value: `sk-1234567890abcdef`
- Description: `Production API key`

### 2. Usar em Formulários

Digite o padrão `{{NOME_VARIAVEL}}` em qualquer campo:

```
{{API_KEY}}
{{BASE_URL}}
{{TOKEN}}
```

Ao sair do campo (blur), a variável será automaticamente substituída pelo valor correspondente.

### 3. Atalho Manual

Pressione `Ctrl+Shift+E` para forçar substituição imediata.

### 4. Import/Export

- **Export**: Baixe todas variáveis como JSON
- **Import**: Carregue variáveis de arquivo JSON

## 🔒 Segurança

⚠️ **IMPORTANTE**: Variáveis são armazenadas **sem criptografia** em `chrome.storage.local`.

**Recomendações**:
- Não armazene dados extremamente sensíveis
- Considere usar em ambientes de desenvolvimento/teste
- Para produção, aguarde versão 2.0 com criptografia

Ver [Documentação de Segurança](./claudedocs/architecture.md#6-segurança) para mais detalhes.

## 📊 Performance

- Content script load: < 50ms
- Replacement latency: < 20ms
- Bundle size total: < 500KB

## 🧪 Testes

### Unit Tests

```bash
npm test
npm run test:watch
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing

Ver [checklist de testes](./claudedocs/architecture.md#83-manual-testing-checklist)

## 📚 Documentação

- [Arquitetura Completa](./claudedocs/architecture.md)
- [Guia de Desenvolvimento](./claudedocs/development-guide.md) _(em breve)_
- [Referência de API](./claudedocs/api-reference.md) _(em breve)_

## 🗺️ Roadmap

### v1.0 (MVP) - Em Desenvolvimento
- ✅ Storage local de variáveis
- ✅ CRUD via Options Page
- ✅ Popup básico
- ✅ Substituição automática
- ✅ Suporte Swagger UI
- ✅ Import/Export JSON

### v1.1 - Melhorias de UX
- Dark mode
- Autocomplete de variáveis
- Search/filter
- Feedback visual aprimorado

### v2.0 - Features Avançadas
- Grupos/ambientes (Dev/Staging/Prod)
- Criptografia com master password
- Histórico de mudanças
- Sincronização cloud opcional

## 🤝 Contribuindo

1. Fork o projeto
2. Crie branch para feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para branch (`git push origin feature/nova-feature`)
5. Abra Pull Request

## 📄 Licença

MIT License - ver [LICENSE](LICENSE) para detalhes

## 👨‍💻 Autor

**Seu Nome**

---

**Desenvolvido com TypeScript + Vite + Web Components**
