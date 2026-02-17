# Fluxo de Mensagens - Background Service Worker

Documentação completa do sistema de message passing entre componentes da extensão.

## Componentes

- **Background Service Worker** (`src/background/service-worker.ts`)
- **Popup** (`src/popup/popup.ts`)
- **Content Script** (`src/content/content-script.ts`)
- **Options Page** (`src/options/options.ts`)

## Tipos de Mensagens

### 1. Storage Operations (Popup/Options → Background)

#### GET_VARIABLES
Obtém todas as variáveis armazenadas.

```typescript
// Request
{ type: 'GET_VARIABLES' }

// Response
Variable[]
```

#### ADD_VARIABLE
Adiciona nova variável.

```typescript
// Request
{
  type: 'ADD_VARIABLE',
  payload: {
    key: string,
    value: string,
    description?: string,
    enabled: boolean
  }
}

// Response
Variable // Com id, createdAt, updatedAt gerados
```

#### UPDATE_VARIABLE
Atualiza variável existente.

```typescript
// Request
{
  type: 'UPDATE_VARIABLE',
  payload: Variable
}

// Response
Variable // Com updatedAt atualizado
```

#### DELETE_VARIABLE
Remove variável.

```typescript
// Request
{
  type: 'DELETE_VARIABLE',
  payload: { id: string }
}

// Response
void
```

#### GET_SETTINGS
Obtém configurações.

```typescript
// Request
{ type: 'GET_SETTINGS' }

// Response
Settings
```

#### UPDATE_SETTINGS
Atualiza configurações.

```typescript
// Request
{
  type: 'UPDATE_SETTINGS',
  payload: Settings
}

// Response
void
```

---

### 2. Analytics (Content Script → Background)

#### VARIABLE_USED
Notifica uso de variável para analytics.

```typescript
// Request
{
  type: 'VARIABLE_USED',
  payload: {
    variableId: string,
    url: string,
    timestamp: string
  }
}

// Response
{ success: true }
```

#### GET_ANALYTICS
Obtém dados de analytics.

```typescript
// Request
{
  type: 'GET_ANALYTICS',
  payload?: { variableId?: string }
}

// Response
AnalyticsData | Record<string, AnalyticsData>
```

---

### 3. Badge and Notifications (Content Script → Background)

#### VARIABLES_DETECTED
Atualiza badge com número de variáveis detectadas na página.

```typescript
// Request
{
  type: 'VARIABLES_DETECTED',
  payload: { count: number }
}

// Response
{ success: true }
```

---

### 4. Import/Export (Options → Background)

#### EXPORT_DATA
Exporta todos os dados (variáveis + settings + analytics).

```typescript
// Request
{ type: 'EXPORT_DATA' }

// Response
{
  version: string,
  variables: Variable[],
  settings: Settings,
  analytics: Record<string, AnalyticsData>,
  exportedAt: string
}
```

#### IMPORT_DATA
Importa dados.

```typescript
// Request
{
  type: 'IMPORT_DATA',
  payload: {
    version: string,
    variables: Variable[],
    settings?: Settings,
    analytics?: Record<string, AnalyticsData>
  }
}

// Response
void
```

---

### 5. Broadcast Notifications (Background → All Components)

#### STORAGE_CHANGED
Notifica alteração no chrome.storage.

```typescript
// Broadcast (Background → All tabs)
{
  type: 'STORAGE_CHANGED',
  changes: chrome.storage.StorageChange
}
```

#### VARIABLES_UPDATED
Notifica que variáveis foram atualizadas.

```typescript
// Broadcast (Background → Popup)
{ type: 'VARIABLES_UPDATED' }
```

#### SETTINGS_UPDATED
Notifica que configurações foram atualizadas.

```typescript
// Broadcast (Background → All)
{ type: 'SETTINGS_UPDATED' }
```

---

### 6. Actions (Background → Content Script)

#### FORCE_REPLACE
Força substituição de variáveis na página.

```typescript
// From: Context menu ou keyboard shortcut
{
  type: 'FORCE_REPLACE'
}
```

#### SELECTION_FOR_VARIABLE
Envia texto selecionado para criar nova variável.

```typescript
// From: Context menu "Nova variável" com texto selecionado
{
  type: 'SELECTION_FOR_VARIABLE',
  payload: { text: string }
}
```

---

## Fluxos Principais

### Fluxo 1: Adicionar Variável

```
1. Popup → Background: ADD_VARIABLE
2. Background: Salva no storage
3. Background → chrome.storage: set()
4. chrome.storage: onChanged event
5. Background → All tabs: STORAGE_CHANGED
6. Background → Popup: VARIABLES_UPDATED
```

### Fluxo 2: Substituir Variáveis

```
1. User: Click context menu "Substituir variáveis"
2. Background → Content Script: FORCE_REPLACE
3. Content Script: Detecta e substitui variáveis
4. Content Script → Background: VARIABLE_USED (para cada variável)
5. Background: Atualiza analytics
```

### Fluxo 3: Detecção Automática

```
1. Content Script: DOMContentLoaded
2. Content Script: Detecta variáveis {{name}}
3. Content Script → Background: VARIABLES_DETECTED (count)
4. Background: Atualiza badge do ícone
```

### Fluxo 4: Context Menu "Nova Variável"

```
1. User: Seleciona texto → click "Nova variável"
2. Background: Abre popup
3. Background → Popup: SELECTION_FOR_VARIABLE
4. Popup: Preenche formulário com texto selecionado
```

---

## Context Menu

### Items Criados

1. **Substituir variáveis nesta página**
   - Contexts: `page`, `editable`
   - Action: Envia `FORCE_REPLACE` para tab ativa

2. **Nova variável**
   - Contexts: `selection`
   - Action: Abre popup + envia texto selecionado

3. **Configurações**
   - Contexts: `page`
   - Action: Abre options page

---

## Keyboard Shortcuts

### Comandos Configurados

1. **Ctrl+Shift+E** (Command+Shift+E no Mac)
   - Comando: `open-popup`
   - Action: Abre popup da extensão

2. **Ctrl+Shift+R** (Command+Shift+R no Mac)
   - Comando: `replace-variables`
   - Action: Substitui variáveis na página ativa

3. **Ctrl+Shift+X** (Command+Shift+X no Mac)
   - Comando: `toggle-extension`
   - Action: Ativa/desativa extensão

---

## Badge System

### Estados do Badge

1. **Variáveis detectadas + Extensão ativa**
   - Text: Número de variáveis (ex: "3")
   - Color: Verde (#10b981)

2. **Variáveis detectadas + Extensão inativa**
   - Text: Número de variáveis (ex: "3")
   - Color: Cinza (#6b7280)

3. **Nenhuma variável detectada**
   - Text: Vazio
   - Color: N/A

### Atualização

Content script detecta variáveis e envia `VARIABLES_DETECTED` com count.
Background atualiza badge baseado em settings.enabled.

---

## Analytics System

### Dados Rastreados

Para cada variável:
- `usageCount`: Número total de vezes que foi usada
- `lastUsed`: Timestamp do último uso (ISO string)
- `urls`: Array de URLs onde foi usada (máximo 20)

### Otimizações

- Cache em memória (Map) para performance
- Salva no storage a cada 5 usos para reduzir I/O
- Limita URLs a 20 por variável
- Analytics são removidos quando variável é deletada

### Acesso

```typescript
// Analytics de uma variável específica
const analytics = await chrome.runtime.sendMessage({
  type: 'GET_ANALYTICS',
  payload: { variableId: 'uuid-123' }
});

// Analytics de todas as variáveis
const allAnalytics = await chrome.runtime.sendMessage({
  type: 'GET_ANALYTICS'
});
```

---

## Error Handling

### Estratégias

1. **Try-Catch em todas as funções assíncronas**
   - Log detalhado de erros
   - Retorna erro estruturado para caller

2. **Broadcast failures são silenciosos**
   - Tabs sem content script causam erro esperado
   - Popup fechado causa erro esperado
   - Ambos são ignorados com `.catch(() => {})`

3. **Global error handlers**
   - `error` event: Captura erros não tratados
   - `unhandledrejection` event: Captura promises rejeitadas

4. **Message handler wrapper**
   - Promise wrapper em `chrome.runtime.onMessage`
   - Retorna `{ error: string }` em caso de falha

---

## Performance Considerations

### Cache Strategy

- **variablesCache**: Array de variáveis em memória
- **analyticsCache**: Map de analytics em memória
- Atualizado em `chrome.storage.onChanged`
- Carregado em `chrome.runtime.onStartup`

### Throttling

- Analytics salvos a cada 5 usos (não a cada uso)
- URLs limitadas a 20 por variável
- Broadcast apenas quando necessário

### Service Worker Lifecycle

- **onInstalled**: Setup inicial (apenas na instalação)
- **onStartup**: Carrega cache (a cada reinício do browser)
- **onMessage**: Responde a mensagens (sempre ativo)
- **idle timeout**: Service worker pode ser terminado após inatividade (cache será recarregado no próximo startup)

---

## Testing Checklist

### Message Passing
- [ ] Popup → Background: GET_VARIABLES
- [ ] Popup → Background: ADD_VARIABLE
- [ ] Popup → Background: UPDATE_VARIABLE
- [ ] Popup → Background: DELETE_VARIABLE
- [ ] Content Script → Background: VARIABLE_USED
- [ ] Content Script → Background: VARIABLES_DETECTED
- [ ] Background → Content Script: FORCE_REPLACE
- [ ] Background → Popup: VARIABLES_UPDATED

### Context Menu
- [ ] Menu items aparecem no click direito
- [ ] "Substituir variáveis" envia FORCE_REPLACE
- [ ] "Nova variável" abre popup com texto selecionado
- [ ] "Configurações" abre options page

### Keyboard Shortcuts
- [ ] Ctrl+Shift+E abre popup
- [ ] Ctrl+Shift+R substitui variáveis
- [ ] Ctrl+Shift+X ativa/desativa extensão

### Badge
- [ ] Badge mostra número de variáveis detectadas
- [ ] Badge verde quando extensão ativa
- [ ] Badge cinza quando extensão inativa
- [ ] Badge vazio quando sem variáveis

### Analytics
- [ ] Uso de variável incrementa usageCount
- [ ] lastUsed é atualizado
- [ ] URLs são adicionadas ao array
- [ ] Analytics persistem após restart
- [ ] Analytics são removidos ao deletar variável

### Error Handling
- [ ] Erros em messages retornam { error: string }
- [ ] Broadcast failures não crasham extensão
- [ ] Global errors são logados
- [ ] Promises rejeitadas são capturadas
