# 🧪 Teste da Funcionalidade de Segregação por Hosts

## Pré-requisitos
1. Remover extensão antiga: `chrome://extensions` → Remover
2. Carregar nova versão: `chrome://extensions` → "Carregar sem compactação" → selecionar pasta `dist/`
3. Conceder permissão "Em todos os sites"

---

## ✅ Checklist de Testes

### 1. Migração de Dados (Variáveis Antigas)
**Objetivo:** Verificar que variáveis antigas continuam funcionando como globais

- [ ] Abrir Options → Verificar que variáveis antigas têm coluna "Hosts" com texto "(global)"
- [ ] Abrir qualquer site → Verificar que variáveis antigas ainda aparecem
- [ ] Usar autocomplete `{{` → Variáveis antigas devem aparecer na lista

**Resultado esperado:** ✅ Variáveis antigas funcionam normalmente (backward compatibility)

---

### 2. Criar Variável Global (Sem Hosts)
**Objetivo:** Testar variável que aparece em todos os sites

- [ ] Options → "Add Variable"
- [ ] Key: `GLOBAL_TOKEN`
- [ ] Value: `abc123xyz`
- [ ] Hosts: (deixar vazio)
- [ ] Salvar
- [ ] Verificar coluna "Hosts" mostra "(global)"
- [ ] Abrir `google.com` → Verificar que `GLOBAL_TOKEN` aparece no popup
- [ ] Abrir `github.com` → Verificar que `GLOBAL_TOKEN` aparece no popup

**Resultado esperado:** ✅ Variável aparece em qualquer site

---

### 3. Criar Variável Específica de Host
**Objetivo:** Testar variável que só aparece em um host específico

- [ ] Options → "Add Variable"
- [ ] Key: `LOCAL_API`
- [ ] Value: `http://localhost:3000/api`
- [ ] Hosts: Adicionar `localhost:3000`
- [ ] Salvar
- [ ] Verificar chip roxo com `localhost:3000` na coluna "Hosts"
- [ ] Abrir `localhost:3000` (ou qualquer localhost na porta 3000)
- [ ] Popup deve mostrar `LOCAL_API`
- [ ] Abrir `google.com`
- [ ] Popup NÃO deve mostrar `LOCAL_API`

**Resultado esperado:** ✅ Variável só aparece em localhost:3000

---

### 4. Criar Variável com Wildcard de Subdomínio
**Objetivo:** Testar pattern `*.example.com`

- [ ] Options → "Add Variable"
- [ ] Key: `STAGING_KEY`
- [ ] Value: `staging-secret-key`
- [ ] Hosts: Adicionar `*.staging.example.com`
- [ ] Salvar
- [ ] Abrir `api.staging.example.com` → Variável deve aparecer
- [ ] Abrir `web.staging.example.com` → Variável deve aparecer
- [ ] Abrir `staging.example.com` (sem subdomínio) → Variável NÃO deve aparecer
- [ ] Abrir `example.com` → Variável NÃO deve aparecer

**Resultado esperado:** ✅ Wildcard funciona corretamente (apenas subdomínios)

---

### 5. Criar Variável com Múltiplos Hosts
**Objetivo:** Testar variável que aparece em vários hosts

- [ ] Options → "Add Variable"
- [ ] Key: `MULTI_ENV`
- [ ] Value: `works-everywhere`
- [ ] Hosts: Adicionar `localhost:3000`
- [ ] Hosts: Adicionar `localhost:8080`
- [ ] Hosts: Adicionar `*.dev.com`
- [ ] Salvar
- [ ] Abrir `localhost:3000` → Variável aparece ✅
- [ ] Abrir `localhost:8080` → Variável aparece ✅
- [ ] Abrir `api.dev.com` → Variável aparece ✅
- [ ] Abrir `google.com` → Variável NÃO aparece ❌

**Resultado esperado:** ✅ Variável aparece apenas nos hosts configurados

---

### 6. Validação de Patterns Inválidos
**Objetivo:** Testar que patterns inválidos são rejeitados

Tentar adicionar patterns inválidos (devem mostrar erro):
- [ ] `http://localhost` (protocolo não permitido) → ❌ Erro
- [ ] `localhost/path` (path não permitido) → ❌ Erro
- [ ] `local host` (espaço não permitido) → ❌ Erro
- [ ] `*.*.example.com` (múltiplos wildcards) → ❌ Erro
- [ ] `example.com:99999` (porta inválida) → ❌ Erro

**Resultado esperado:** ✅ Validação rejeita patterns inválidos

---

### 7. Editar Hosts de Variável Existente
**Objetivo:** Testar modificação de hosts

- [ ] Options → Editar variável `GLOBAL_TOKEN` (criada no teste 2)
- [ ] Adicionar host `localhost:3000`
- [ ] Salvar
- [ ] Abrir `localhost:3000` → Variável aparece ✅
- [ ] Abrir `google.com` → Variável NÃO aparece mais ❌

**Resultado esperado:** ✅ Modificação de hosts funciona corretamente

---

### 8. Remover Host de Variável
**Objetivo:** Testar remoção de host específico

- [ ] Options → Editar variável `MULTI_ENV` (teste 5)
- [ ] Remover chip `localhost:8080` (clicar no X)
- [ ] Salvar
- [ ] Abrir `localhost:8080` → Variável NÃO aparece mais ❌
- [ ] Abrir `localhost:3000` → Variável ainda aparece ✅

**Resultado esperado:** ✅ Remoção de host individual funciona

---

### 9. Transformar Variável em Global
**Objetivo:** Remover todos os hosts para tornar global

- [ ] Options → Editar variável `LOCAL_API` (teste 3)
- [ ] Remover TODOS os hosts (array vazio)
- [ ] Salvar
- [ ] Coluna "Hosts" deve mostrar "(global)"
- [ ] Abrir qualquer site → Variável aparece

**Resultado esperado:** ✅ Variável vazia = global

---

### 10. UI do Popup - Indicador de Host
**Objetivo:** Verificar que popup mostra host atual

- [ ] Abrir `localhost:3000`
- [ ] Clicar no ícone da extensão (popup abre)
- [ ] Verificar que há indicador mostrando "localhost:3000" no topo
- [ ] Fechar popup
- [ ] Abrir `google.com`
- [ ] Abrir popup novamente
- [ ] Indicador deve mostrar "google.com"

**Resultado esperado:** ✅ Popup sempre mostra host atual

---

### 11. Console Logs (Verificação de Filtragem)
**Objetivo:** Verificar logs do content script

- [ ] Criar 3 variáveis: 1 global, 2 específicas de hosts diferentes
- [ ] Abrir DevTools (F12) → Console
- [ ] Navegar para um site
- [ ] Procurar por `[Content Script]`
- [ ] Log deve mostrar formato: `Loaded X total, Y for host: hostname:port`

**Exemplo:**
```
[Content Script] Loaded 10 total, 3 for host: localhost:3000
```

**Resultado esperado:** ✅ Logs mostram filtragem correta

---

### 12. Autocomplete com Hosts
**Objetivo:** Verificar que autocomplete só mostra variáveis relevantes

- [ ] Abrir `localhost:3000`
- [ ] Criar campo de input em qualquer página
- [ ] Digitar `{{`
- [ ] Autocomplete deve mostrar apenas variáveis globais + variáveis de `localhost:3000`
- [ ] Variáveis de outros hosts NÃO devem aparecer

**Resultado esperado:** ✅ Autocomplete filtrado por host

---

### 13. Performance (Opcional)
**Objetivo:** Verificar que filtragem não causa lag

- [ ] Criar 50 variáveis (mix de globais e host-specific)
- [ ] Navegar entre diferentes sites
- [ ] Abrir popup
- [ ] Verificar que não há lag perceptível (< 100ms)

**Resultado esperado:** ✅ Sem impacto de performance

---

## 📊 Resumo

**Total de testes:** 13
**Aprovados:** ___/13
**Falhados:** ___/13

### Problemas Encontrados (se houver):
-

### Notas:
-

---

## ✅ Após Testes

Se todos os testes passaram:
1. ✅ Marcar task #6 como completed
2. ✅ Commit final das mudanças
3. ✅ Funcionalidade pronta para uso!

Se algum teste falhou:
1. ❌ Documentar o problema
2. ❌ Reportar ao team para correção
