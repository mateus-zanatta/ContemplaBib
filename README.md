# Pentatônica — app didático de guitarra (EM Aulas de Música)

App para celular (PWA) que ensina a **escala pentatônica** na guitarra, com **afinações** e **todas as escalas de cada afinação**.
Feito com **React + Vite + Framer Motion** (animações). Funciona **offline** e pode ser instalado na **tela inicial** como um app normal.

## As 5 telas (deslize para os lados para trocar)

| Tela | O que tem |
|---|---|
| 🎓 **Teoria** | O que é a pentatônica, círculo dos 12 sons, "receita" da escala, menor × maior |
| 🎸 **Braço** | Pentatônica no braço da guitarra: 5 posições (caixas), notas/graus/modo treino, tocar subindo/descendo |
| 📚 **Aula** | Aula guiada em 7 passos com desafio ("ache a tônica"), controle para mudar de tom e checklist de prática |
| 🎚️ **Afinações** | 12 afinações (Padrão, Drop D, DADGAD, Open G…): toque nas cordas para ouvir como devem soar |
| 🎼 **Escalas** | 13 escalas (pentatônicas, blues, modos…) em **qualquer afinação** e qualquer tom |

Extras: alternar entre **cifras (A B C)** e **solfejo (Dó Ré Mi)** no topo; ligar/desligar o som; o app lembra a última tela e a afinação escolhida.

## Instalar no celular

1. Publique o app (veja abaixo) e abra o endereço no celular.
2. **Android (Chrome):** menu ⋮ → *Instalar app* (ou use o botão que aparece na tela Teoria).
3. **iPhone (Safari):** botão *Compartilhar* → *Adicionar à Tela de Início*.

> iPhone: se não sair som, desative o modo silencioso (chave lateral). O som é gerado pelo próprio aparelho, sem arquivos de áudio.

## Rodar no computador

```bash
npm install
npm run dev      # abre em http://localhost:5173 (também na rede local, para testar no celular)
npm test         # testes da teoria musical (as 5 caixas da pentatônica etc.)
npm run build    # gera a pasta dist/ pronta para publicar
npm run preview  # testa a versão final (a instalação/offline só funciona aqui, não no dev)
```

## Publicar (precisa ser HTTPS para instalar no celular)

O app é só arquivos estáticos (HTML/JS/CSS) na pasta `dist/`; qualquer hospedagem de site estático serve.

**GitHub Pages (já configurado):** o arquivo `.github/workflows/pages.yml` faz o build e publica a cada push na `main`.
Só precisa ligar uma vez: **Settings → Pages → Source: GitHub Actions**. O endereço fica `https://<usuario>.github.io/<repositorio>/`.

**Azure Static Web Apps (alternativa):** crie o recurso apontando para este repositório com
*App location* `/`, *Output location* `dist` e *Build command* `npm run build` (sem API). O Azure também fornece HTTPS e um endereço `*.azurestaticapps.net`.

## Como funciona (para estudar)

- `src/theory/music.js` — a teoria sem React: grafia das notas (F♯ × G♭), e o algoritmo das **posições** ("2 notas por corda, em sequência"), que gera as 5 caixas clássicas na afinação padrão e funciona em qualquer afinação.
- `src/theory/data.js` — afinações e escalas (só dados; é fácil acrescentar mais).
- `src/components/Fretboard.jsx` — o braço em SVG, com animações.
- `src/audio.js` — som de corda dedilhada gerado no aparelho (síntese Karplus-Strong).
- `src/App.jsx` — as telas lado a lado com `scroll-snap` (deslize nativo) + animações ligadas ao progresso da rolagem.
- `vite.config.js` — configuração do PWA (manifesto, ícones, cache offline).

Para acrescentar uma afinação, basta uma linha em `TUNINGS` (`midi` = número da nota de cada corda, `E2 = 40`).
