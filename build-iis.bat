@echo off
setlocal

echo ============================================
echo  d-IA-gram - Build de producao para IIS
echo ============================================

cd /d "%~dp0frontend"

rem Node impar (ex.: 25) nao e suportado oficialmente pelo Angular; silencia o erro de versao.
set "NG_DISABLE_VERSION_CHECK=1"

if not exist "node_modules" (
  echo [1/2] Instalando dependencias ^(npm ci^)...
  call npm ci || goto :error
) else (
  echo [1/2] Dependencias presentes - pulando instalacao.
)

echo [2/2] Compilando ^(--configuration production^)...
call npx ng build --configuration production || goto :error

echo.
echo ============================================
echo  Build concluido com sucesso!
echo.
echo  Publique o CONTEUDO desta pasta no site do IIS:
echo     %CD%\dist\frontend\browser
echo.
echo  O web.config (roteamento SPA) ja vai incluso.
echo  Pre-requisito no servidor: modulo "URL Rewrite" do IIS.
echo ============================================
goto :end

:error
echo.
echo *** FALHA no build. Verifique as mensagens acima. ***
endlocal
exit /b 1

:end
endlocal
