# Content Script - Design Técnico

## Arquitetura

### Componentes Principais

1. **injector.ts** - Núcleo de detecção e substituição
2. **observers.ts** - Observação de mudanças no DOM
3. **autocomplete.ts** - Sistema de autocomplete
4. **ui-feedback.ts** - Feedback visual
5. **messaging.ts** - Comunicação com background
6. **swagger-detector.ts** - Detecção especial Swagger UI

---

## 1. injector.ts

### Responsabilidades
- Detectar elementos editáveis (input, textarea, contenteditable)
- Parser de padrão {{variavel}}
- Sistema de substituição (manual/automático)
- Gerenciamento de estado de substituição

### Regex Pattern
```typescript
const VARIABLE_PATTERN = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
```

### Interfaces
```typescript
interface DetectedVariable {
  name: string;
  element: HTMLElement;
  startIndex: number;
  endIndex: number;
  fullMatch: string;
}

interface InjectorConfig {
  autoReplace: boolean;
  highlightColor: string;
  enableAutocomplete: boolean;
}
```

### Funções Core
```typescript
// Detectar elementos editáveis na página
function detectEditableElements(): HTMLElement[]

// Encontrar variáveis em um elemento
function findVariables(element: HTMLElement): DetectedVariable[]

// Substituir variável por valor
function replaceVariable(variable: DetectedVariable, value: string): void

// Substituir todas as variáveis em um elemento
function replaceAllInElement(element: HTMLElement, variables: Map<string, string>): void
```

---

## 2. observers.ts

### MutationObserver Strategy
- Observar adições de novos elementos
- Reprocessar quando DOM mudar
- Debounce para evitar múltiplos processamentos
- Desconectar quando extensão desativada

### Implementação
```typescript
const observer = new MutationObserver((mutations) => {
  const addedElements = mutations
    .flatMap(m => Array.from(m.addedNodes))
    .filter(node => node.nodeType === Node.ELEMENT_NODE);

  processNewElements(addedElements);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

---

## 3. autocomplete.ts

### Trigger: Quando usuário digita "{{"

### Features
- Mostrar dropdown com variáveis disponíveis
- Filtragem incremental enquanto digita
- Navegação com teclado (Arrow Up/Down)
- Seleção com Enter ou Click
- Fechar com ESC
- Posicionamento relativo ao cursor

### UI Component
```html
<div class="swagger-envs-autocomplete">
  <input type="text" class="autocomplete-filter" placeholder="Filtrar variáveis..." />
  <ul class="autocomplete-list">
    <li class="autocomplete-item">api_url</li>
    <li class="autocomplete-item">user_id</li>
    <li class="autocomplete-item selected">token</li>
  </ul>
</div>
```

### Posicionamento
```typescript
function getCaretCoordinates(element: HTMLInputElement): { x: number, y: number }
function showAutocompleteAt(x: number, y: number, variables: string[]): void
```

---

## 4. ui-feedback.ts

### Visual Indicators

#### 1. Highlight de Variáveis
- Cor de fundo suave para {{variavel}}
- Border destacado
- Tooltip com nome da variável

#### 2. Badge Counter
```html
<div class="swagger-envs-badge">
  3 variáveis detectadas
</div>
```

#### 3. Botão "Substituir Tudo"
```html
<button class="swagger-envs-replace-all">
  ⚡ Substituir todas (3)
</button>
```

### CSS Injection
```css
.swagger-envs-highlight {
  background-color: rgba(255, 215, 0, 0.2);
  border-bottom: 2px dotted #ffa500;
  cursor: help;
}

.swagger-envs-badge {
  position: fixed;
  top: 10px;
  right: 10px;
  background: #4caf50;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 9999;
}
```

---

## 5. messaging.ts

### Comunicação com Background

#### Solicitar variáveis
```typescript
async function getVariables(): Promise<Map<string, string>> {
  return chrome.runtime.sendMessage({
    type: 'GET_VARIABLES'
  });
}
```

#### Notificar uso de variável
```typescript
function notifyVariableUsed(variableName: string, page: string): void {
  chrome.runtime.sendMessage({
    type: 'VARIABLE_USED',
    data: { variableName, page, timestamp: Date.now() }
  });
}
```

#### Listener de updates
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VARIABLES_UPDATED') {
    refreshDetectedVariables();
  }
});
```

---

## 6. swagger-detector.ts

### Detecção de Swagger UI

#### Estratégias
1. Detectar pela presença de elementos específicos
2. Verificar scripts carregados
3. Observar padrões de URL

```typescript
function isSwaggerPage(): boolean {
  return !!(
    document.querySelector('.swagger-ui') ||
    document.querySelector('[id*="swagger"]') ||
    window.location.pathname.includes('swagger') ||
    window.location.pathname.includes('api-docs')
  );
}
```

### Detectar Request Body Editor

#### Monaco Editor
```typescript
function findMonacoEditor(): HTMLElement | null {
  return document.querySelector('.monaco-editor');
}
```

#### ACE Editor
```typescript
function findAceEditor(): HTMLElement | null {
  return document.querySelector('.ace_editor');
}
```

#### CodeMirror
```typescript
function findCodeMirror(): HTMLElement | null {
  return document.querySelector('.CodeMirror');
}
```

### Injeção em Editores Especiais
```typescript
function injectIntoSwaggerEditor(editor: HTMLElement): void {
  // Estratégia específica para cada tipo de editor
  // Monaco: usar API monaco.editor.getModels()
  // ACE: usar API ace.edit()
  // CodeMirror: usar API editor.getValue()
}
```

---

## Performance Considerations

### 1. Debouncing
```typescript
const debouncedProcess = debounce(processElements, 300);
```

### 2. Throttling de MutationObserver
```typescript
let processingQueue: HTMLElement[] = [];
const processQueue = throttle(() => {
  processElements(processingQueue);
  processingQueue = [];
}, 500);
```

### 3. Lazy Loading
- Carregar variáveis apenas quando necessário
- Cache de variáveis com TTL
- Processar apenas elementos visíveis (Intersection Observer)

### 4. Evitar Reprocessamento
```typescript
const processedElements = new WeakSet<HTMLElement>();

function processElement(element: HTMLElement) {
  if (processedElements.has(element)) return;

  // ... processar

  processedElements.add(element);
}
```

---

## Casos Especiais

### 1. Múltiplas Variáveis
```
Input: "{{api_url}}/users/{{user_id}}/posts/{{post_id}}"
Output: "https://api.example.com/users/123/posts/456"
```

### 2. Variáveis Aninhadas (NÃO suportado)
```
Input: "{{{{nested}}}}"  ❌
```

### 3. Variáveis Parciais
```
Input: "{{incomplete"  → Não substituir
Input: "{{valid}}"     → Substituir
```

### 4. Escape de Variáveis
```
Input: "\{\{not_a_var\}\}"  → Não substituir
```

---

## Workflow de Substituição

### Modo Manual (padrão)
1. Detectar variáveis
2. Mostrar badge com contador
3. Highlight variáveis
4. Usuário clica em "Substituir Tudo"
5. Buscar valores do storage
6. Substituir todas de uma vez
7. Notificar sucesso

### Modo Automático (opcional)
1. Detectar variáveis
2. Buscar valores automaticamente
3. Substituir imediatamente
4. Mostrar notificação de substituição

---

## Testes Necessários

### Unit Tests
- Parser de variáveis
- Substituição de valores
- Detecção de elementos

### Integration Tests
- MutationObserver funcionando
- Comunicação com background
- Autocomplete funcionando

### E2E Tests
- Swagger UI real
- Múltiplos tipos de inputs
- Performance com muitos elementos

---

## Roadmap de Implementação

### Fase 1: Core (MVP)
1. ✅ injector.ts - detecção básica
2. ✅ messaging.ts - comunicação
3. ✅ ui-feedback.ts - highlight e badge
4. ✅ Substituição manual

### Fase 2: Enhanced
5. ✅ autocomplete.ts
6. ✅ observers.ts
7. ✅ Substituição automática (opcional)

### Fase 3: Special Cases
8. ✅ swagger-detector.ts
9. ✅ Suporte a editores especiais
10. ✅ Performance otimization
