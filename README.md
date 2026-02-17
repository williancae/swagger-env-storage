# Swagger Environment Variables

<p align="center">
  <img src="imgs/logo.png" style="width: 40%; height: auto;"  alt="Logo Swagger Environment Variables" width="200">
</p>

<p align="center">
  <strong>Otimize seu fluxo de trabalho de testes de API com gerenciamento inteligente de variáveis</strong>
</p>

<p align="center">
  <a href="https://github.com/williancae/swagger-env-vars">
    <img src="https://img.shields.io/badge/versão-1.0.0-blue.svg" alt="Versão">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/licença-MIT-green.svg" alt="Licença">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.3-blue.svg" alt="TypeScript">
  </a>
</p>

<p align="center">
  <a href="README.EN.md">🇺🇸 Read in English</a>
</p>

---

## 🎯 O que é isso?

Uma extensão de navegador que substitui automaticamente `{{variáveis}}` em formulários web pelos seus valores armazenados. Perfeita para testes de API no Swagger UI, mas funciona em qualquer lugar!

Pare de copiar e colar tokens de autenticação, chaves de API e URLs manualmente. Apenas digite `{{nomeToken}}` e deixe a extensão fazer o resto.

## ✨ Recursos Principais

- 🔍 **Detecção Automática**: Encontra padrões `{{variável}}` automaticamente
- ⚡ **Substituição Rápida**: Alt+Shift+R para substituir todas as variáveis instantaneamente
- 💾 **Armazenamento Local**: Tudo fica na sua máquina
- 🎨 **Autocomplete Inteligente**: Digite `{{` para ver suas variáveis
- 🌐 **Multi-Host**: Organize variáveis por endpoint de API
- 📤 **Importar/Exportar**: Faça backup e compartilhe configurações

## 📸 Capturas de Tela

### Popup de Acesso Rápido

![Interface do Popup](imgs/pop_up.png)

### Exemplo de Uso

![Exemplo de Uso](imgs/exemplo_de_uso.png)

### Painel Administrativo

![Painel Admin](imgs/painel_adm.png)

## 📦 Instalação

### Chrome/Edge

1. Baixe ou clone este repositório
2. Execute `npm install && npm run build`
3. Abra `chrome://extensions/`
4. Ative o "Modo do desenvolvedor"
5. Clique em "Carregar sem compactação" e selecione a pasta `dist/`

### Firefox

1. Baixe ou clone este repositório
2. Execute `npm install && npm run build`
3. Abra `about:debugging#/runtime/this-firefox`
4. Clique em "Carregar extensão temporária"
5. Selecione o `manifest.json` da pasta `dist/`

> 📚 **Instruções detalhadas**: Veja o [Guia de Instalação](docs/ARCHITECTURE.md#installation)

## 🚀 Início Rápido

### 1. Adicionar uma Variável

- Clique no ícone da extensão ou pressione `Alt+Shift+E`
- Clique em "Adicionar Variável"
- Digite um nome (ex: `authToken`) e valor (ex: `Bearer xyz...`)
- Salve

### 2. Usar Variáveis

Digite `{{authToken}}` em qualquer campo de entrada e será substituído automaticamente!

### Atalhos de Teclado

| Atalho        | Ação                       |
| ------------- | -------------------------- |
| `Alt+Shift+E` | Abrir popup                |
| `Alt+Shift+R` | Substituir todas variáveis |
| `Alt+Shift+T` | Alternar extensão          |

### Autocomplete

1. Digite `{{` em qualquer campo
2. Veja suas variáveis em um dropdown
3. Use as setas para selecionar
4. Pressione Enter para inserir

## 📚 Documentação

- 📖 [Guia de Contribuição](docs/CONTRIBUTING.pt-BR.md)
- 🏗️ [Arquitetura & Desenvolvimento](docs/ARCHITECTURE.md)
- 🔒 [Política de Segurança](docs/SECURITY.md)
- 🗺️ [Roadmap](docs/ROADMAP.pt-BR.md)

## 🤝 Contribuindo

Contribuições são bem-vindas! Confira nosso [Guia de Contribuição](docs/CONTRIBUTING.pt-BR.md) para começar.

Links rápidos:

- 🐛 [Reportar um Bug](https://github.com/williancae/swagger-env-vars/issues/new?template=bug_report.md)
- 💡 [Sugerir um Recurso](https://github.com/williancae/swagger-env-vars/issues/new?template=feature_request.md)
- 💬 [Discussões](https://github.com/williancae/swagger-env-vars/discussions)

## ⚠️ Aviso de Segurança

As variáveis são armazenadas **sem criptografia** no armazenamento local. Adequado para ambientes de dev/teste, mas evite armazenar credenciais de produção altamente sensíveis.

A versão 2.0 incluirá criptografia com senha mestra. Veja a [Política de Segurança](docs/SECURITY.md) para detalhes.

## 📄 Licença

Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ☕ Me Pague um Café

Se esta extensão te ajudou, considere apoiar seu desenvolvimento!

**PIX**: `williancaecam@gmail.com`

Seu apoio ajuda a manter este projeto ativo e gratuito para todos. Obrigado! 🙏

## 📞 Suporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/williancae/swagger-env-vars/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/williancae/swagger-env-vars/discussions)
- 📧 **Email**: <williancaecam@gmail.com>

---

<p align="center">
  Feito com ❤️ por desenvolvedores, para desenvolvedores
</p>
