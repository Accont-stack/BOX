# 📦 THE BOX — Gestão Financeira

Um **Progressive Web App (PWA)** moderno e inovador para controle financeiro pessoal com **IA integrada**, análise de despesas em tempo real e suporte offline completo.

## ✨ Recursos Principais

### 💰 Gestão Financeira
- ✅ Controle de receitas e despesas
- ✅ Categorias customizáveis
- ✅ Filtros por categoria e data
- ✅ Gráficos de análise visual
- ✅ Transações recorrentes (contas fixas)

### 🤖 IA com DeepSeek
- 🎙️ **Assistente por voz** - Adicione transações falando
- 🧠 **IA integrada** - Processamento automático de comandos
- 📊 **Análise inteligente** - Categorização automática de despesas

### 📱 PWA (Progressive Web App)
- 📥 Instale como app nativo (Android/iPhone)
- ⚡ Funciona offline com Service Worker
- 💾 Sincronização automática com Google Sheets
- 🎨 Interface responsiva e moderna

### 🔐 Segurança
- 🔑 Sistema de autenticação com licença PRO
- 🛡️ Dados armazenados localmente
- 👤 Multi-usuário com profiles separados

## 🚀 Como Usar

### Instalação Local
1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/the-box.git
cd the-box
```

2. Abra `index.html` em um servidor local (recomendado):
```bash
# Python 3
python -m http.server 8000

# Node.js (se tiver http-server instalado)
npx http-server
```

3. Acesse em `http://localhost:8000`

### Credenciais Padrão
- **Email:** `admin`
- **Senha:** `1570`

### Ativar Versão PRO
1. Faça login com a conta admin
2. Clique em **"Ativar Licença"**
3. Digite: `BOXPRO`
4. Acesso completo ao assistente por voz e backups!

## 🛠️ Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **IA:** DeepSeek API V3
- **Storage:** LocalStorage + Google Sheets Integration
- **PWA:** Service Worker + Web App Manifest
- **Voice:** Web Speech API (Chrome/Edge/Samsung Internet)

## 📂 Estrutura

```
the-box/
├── index.html          # Interface principal
├── app.js              # Lógica financeira
├── ai-assistant.js     # Integração IA + Voz
├── styles.css          # Estilos CSS
├── manifest.json       # PWA Manifest
├── sw.js              # Service Worker
├── .gitignore         # Arquivos ignorados
└── readme.md          # Este arquivo
```

## 🔧 Configuração IA (DeepSeek)

Para usar o assistente por voz com IA:

1. Obtenha uma chave API em: [https://platform.deepseek.com](https://platform.deepseek.com)
2. Abra `ai-assistant.js`
3. Substitua a chave na linha:
```javascript
const DEEPSEEK_API_KEY = 'sk-seu-token-aqui';
```

## 📱 Instalar como App

### Android (Chrome/Edge)
1. Clique nos 3 pontos → "Instalar app"
2. Clique em "Instalar"
3. O ícone aparecerá na tela inicial

### iPhone (Safari)
1. Clique em "Compartilhar" (⬆️)
2. Selecione "Adicionar à Tela Inicial"
3. Clique em "Adicionar"

## 💾 Backup e Restauração (PRO)

- **Exportar JSON:** Faça backup completo dos seus dados
- **Exportar CSV:** Para análises em Excel
- **Restaurar:** Recarregue seus dados de um backup

## 🔐 Privacidade

- ✅ **Sem rastreamento:** Nenhum dado é enviado sem sua permissão
- ✅ **Armazenamento Local:** Seus dados ficam no seu dispositivo
- ✅ **Google Sheets Opcional:** Você controla o que sincroniza

## 🐛 Reportar Problemas

Encontrou um bug? Abra uma [Issue](https://github.com/seu-usuario/the-box/issues) com:
- Descrição do problema
- Passos para reproduzir
- Screenshots (se aplicável)
- Navegador/dispositivo usado

## 📄 Licença

Este projeto está sob licença MIT. Veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! 

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 👨‍💻 Autor

**Seu Nome** - Desenvolvedor Full Stack

- 🌐 [Seu Portfolio](https://seusite.com)
- 💼 [LinkedIn](https://linkedin.com/in/seuuser)
- 🐙 [GitHub](https://github.com/seuuser)

## 🎯 Roadmap

- [ ] Integração com banco de dados
- [ ] App mobile nativo (React Native)
- [ ] Dashboard avançado com IA
- [ ] Previsões de gastos (Machine Learning)
- [ ] Suporte a múltiplas moedas
- [ ] Relatórios mensais/anuais em PDF

## 🙏 Agradecimentos

- DeepSeek pela excelente API de IA
- Comunidade open-source
- Todos que contribuem com feedback

---

**Desenvolvido com ❤️**

Versão: 1.0.0 | Data: 2025
