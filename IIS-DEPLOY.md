# Deploy no IIS

Build de produção em um passo e publicação como site estático no IIS.

## 1. Gerar o build

Na raiz do projeto, dê duplo-clique ou rode:

```bat
build-iis.bat
```

Isso instala dependências (se faltarem), compila em produção e gera os arquivos prontos em:

```
frontend\dist\frontend\browser\
```

O `web.config` (roteamento da SPA) já vai incluído nessa pasta.

## 2. Pré-requisito no servidor IIS

Instale o módulo **URL Rewrite** (uma vez por servidor):
<https://www.iis.net/downloads/microsoft/url-rewrite>

Sem ele, a rota `/mermaid` (e recarregar a página) retorna 404, porque o IIS não saberá
redirecionar as rotas do Angular para o `index.html`.

## 3. Publicar

1. No **Gerenciador do IIS**, crie um *Site* (ou *Aplicativo*) apontando o **Caminho físico**
   para uma pasta no servidor (ex.: `C:\inetpub\d-ia-gram`).
2. Copie **todo o conteúdo** de `frontend\dist\frontend\browser\` para essa pasta.
3. Acesse pela URL configurada. Pronto — app 100% estático, sem backend nem banco.

## Hospedar sob um subcaminho (opcional)

Se o app não ficar na raiz do site (ex.: `http://servidor/diagrama`), recompile ajustando a base:

```bat
cd frontend
set NG_DISABLE_VERSION_CHECK=1
npx ng build --configuration production --base-href /diagrama/
```
