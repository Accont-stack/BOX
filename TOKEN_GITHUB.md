# 🔐 Como Gerar Personal Access Token para GitHub

## Passo 1: Abrir Settings de Tokens
Acesse este link direto:
```
https://github.com/settings/tokens/new
```

Ou manualmente:
1. Vá para [https://github.com](https://github.com)
2. Clique sua foto de perfil (canto superior direito)
3. Clique **Settings**
4. No menu esquerdo, vá para **Developer settings**
5. Clique **Personal access tokens**
6. Clique **Tokens (classic)**
7. Clique **Generate new token** → **Generate new token (classic)**

## Passo 2: Configurar o Token
Preencha assim:

**Token name:** `git-push`

**Expiration:** `90 days` (ou sua preferência)

**Select scopes:** Marque APENAS:
- ✅ `repo` (todo o acesso)
- ✅ `gist`

## Passo 3: Gerar
Clique em **Generate token** (botão verde no final)

## Passo 4: COPIAR O TOKEN
⚠️ **IMPORTANTE:** Você vai ver o token uma única vez!
- Copie o token (Ctrl+C)
- **Nunca compartilhe com ninguém!**
- Se perder, delete e crie outro

## Passo 5: Usar no Git
No PowerShell, quando pedir autenticação:

```powershell
# Username: seu-usuario-github
# Password: cole-o-token-aqui-nao-a-senha
```

## Passo 6: Tentar Push Novamente

```powershell
cd "c:\Users\Vip\Documents\PROJETO THE BOX CONTROL\PROJETO B ORIGIN"
git push -u origin main
```

Se pedir login:
- **Username:** `Accont-stack`
- **Password:** Cole o token gerado (não é a senha da sua conta!)

## ✅ Pronto!
Seu código estará no GitHub! 🎉

---

**Depois, você pode usar:**
- GitHub CLI para autenticação automática
- SSH keys (mais seguro)
- Outros tipos de tokens

Mas por enquanto, o token funciona perfeitamente!
