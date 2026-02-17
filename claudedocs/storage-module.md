# Storage Module Documentation

## Visão Geral

Módulo completo de gerenciamento de variáveis de ambiente para a extensão Swagger Environment Variables. Implementa padrão Singleton com cache, validação robusta, e operações CRUD completas.

## Arquitetura

### Arquivos Principais

- **`src/shared/storage.ts`**: Serviço principal de storage
- **`src/shared/types.ts`**: Interfaces TypeScript
- **`src/shared/constants.ts`**: Constantes e limites
- **`src/shared/utils.ts`**: Funções utilitárias
- **`tests/storage.test.ts`**: Testes unitários

### Estrutura de Dados

```typescript
interface Variable {
  id: string;              // UUID único
  key: string;             // Nome da variável (ex: "API_URL")
  value: string;           // Valor da variável
  description?: string;    // Descrição opcional
  enabled: boolean;        // Se a variável está ativa
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}

interface StorageData {
  version: string;
  variables: Variable[];
  settings: Settings;
}
```

## API do StorageService

### Singleton Instance

```typescript
const storage = StorageService.getInstance();
await storage.initialize();
```

### CRUD Operations

#### getAllVariables()
```typescript
const variables: Variable[] = await storage.getVariables();
```

#### getVariable(key)
```typescript
const variable: Variable | null = await storage.getVariable('API_URL');
```

#### saveVariable(variable)
```typescript
// Criar nova variável
const created = await storage.saveVariable({
  key: 'API_URL',
  value: 'https://api.example.com',
  description: 'Base API URL',
  enabled: true
});

// Atualizar existente
const updated = await storage.saveVariable({
  id: created.id,
  value: 'https://api.production.com'
});
```

#### deleteVariable(key)
```typescript
const deleted: boolean = await storage.deleteVariable('API_URL');
```

#### deleteVariableById(id)
```typescript
const deleted: boolean = await storage.deleteVariableById('uuid-here');
```

### Search

```typescript
const results = await storage.searchVariables('api');
// Busca em key, value e description (case-insensitive)
```

### Import/Export

#### Export
```typescript
const json: string = await storage.exportVariables();
// JSON com version, exportedAt, variables[]
```

#### Import
```typescript
// Substituir todas as variáveis
await storage.importVariables(json, false);

// Merge com existentes (atualiza duplicatas)
await storage.importVariables(json, true);
```

### Storage Listeners

```typescript
storage.onChanged((changes) => {
  console.log('Storage changed:', changes);
});
```

### Utility Methods

```typescript
// Limpar todas as variáveis
await storage.clearVariables();

// Estatísticas de uso
const stats = await storage.getStorageStats();
// { bytesInUse: 1024, quota: 10485760 }
```

## Validação

### Regras de Validação

1. **Key (Nome da Variável)**:
   - Obrigatório
   - Máximo 50 caracteres
   - Apenas `[a-zA-Z0-9_]` (letras, números, underscore)
   - Não pode ser duplicado

2. **Value (Valor)**:
   - Máximo 10.000 caracteres

### Códigos de Erro

```typescript
class StorageError extends Error {
  code: string;
}

// Códigos possíveis:
// - INVALID_KEY: Chave inválida ou vazia
// - KEY_TOO_LONG: Nome excede 50 caracteres
// - INVALID_KEY_FORMAT: Caracteres inválidos no nome
// - VALUE_TOO_LONG: Valor excede 10.000 caracteres
// - DUPLICATE_KEY: Chave já existe
// - INVALID_JSON: JSON de importação inválido
// - INVALID_FORMAT: Formato de importação incorreto
// - INVALID_VARIABLE: Variável importada inválida
```

## Performance

### Cache System

- Cache de 5 segundos para leitura
- Invalidação automática após escrita
- Reduz chamadas ao chrome.storage.local

### Best Practices

```typescript
// ✅ BOM: Buscar todas de uma vez
const variables = await storage.getVariables();
const apiUrl = variables.find(v => v.key === 'API_URL');

// ❌ EVITAR: Múltiplas chamadas individuais
const var1 = await storage.getVariable('VAR1');
const var2 = await storage.getVariable('VAR2');
const var3 = await storage.getVariable('VAR3');
```

## Testes

### Executar Testes

```bash
npm test tests/storage.test.ts
```

### Cobertura

- ✅ Singleton pattern
- ✅ Inicialização
- ✅ CRUD completo
- ✅ Validação de dados
- ✅ Busca e filtros
- ✅ Import/Export
- ✅ Listeners
- ✅ Casos de erro

## Uso em Outros Módulos

### Background Service Worker

```typescript
import { StorageService } from '@/shared/storage';

const storage = StorageService.getInstance();
await storage.initialize();

// Sincronizar variáveis com content scripts
storage.onChanged((changes) => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'VARIABLES_UPDATED',
        variables: changes.variables?.newValue || []
      });
    });
  });
});
```

### Popup/Options UI

```typescript
import { StorageService } from '@/shared/storage';

const storage = StorageService.getInstance();

// Listar variáveis
const variables = await storage.getVariables();
renderVariables(variables);

// Adicionar nova
document.getElementById('add-btn').addEventListener('click', async () => {
  try {
    await storage.saveVariable({
      key: keyInput.value,
      value: valueInput.value,
      description: descInput.value
    });
    alert('Variável salva com sucesso!');
  } catch (error) {
    if (error instanceof StorageError) {
      alert(error.message);
    }
  }
});
```

### Content Script

```typescript
import { StorageService } from '@/shared/storage';

const storage = StorageService.getInstance();

// Obter variáveis para substituição
const variables = await storage.getVariables();
const enabledVars = variables.filter(v => v.enabled);

// Substituir no texto
text = text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  const variable = enabledVars.find(v => v.key === key);
  return variable ? variable.value : match;
});
```

## Segurança

### Considerações

1. **Dados Sensíveis**: Variáveis podem conter tokens/senhas
   - Usar `chrome.storage.local` (não sincroniza)
   - Considerar adicionar flag `isSecret` para mascarar na UI

2. **Validação**: Sempre validar entrada do usuário
   - Previne XSS através de nomes de variáveis
   - Limita tamanho para prevenir quota overflow

3. **Exportação**: JSON exportado pode conter dados sensíveis
   - Avisar usuário antes de compartilhar
   - Considerar criptografia opcional

## Migração Futura

### Versionamento

```typescript
// Estrutura preparada para migrações
if (data.version === '1.0.0') {
  // Migrar para 2.0.0
  data = migrateV1toV2(data);
}
```

### Extensões Planejadas

- [ ] Grupos de variáveis (tags/categorias)
- [ ] Histórico de mudanças
- [ ] Sincronização cloud (opcional)
- [ ] Variáveis computadas (referências)
- [ ] Criptografia para valores sensíveis

## Referências

- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
