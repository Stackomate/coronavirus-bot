const startMsg = `Bem-vindo! Você receberá atualizações sobre o número de casos confirmados de COVID-19 no Brasil.


ℹ️ Você pode ajustar a <b>frequência</b> e <b>horário</b> de notificações com os comandos disponíveis. Caso queira desativá-lo por tempo indeterminado, use /stop 

⚠ <b>Importante:</b> Quando bloqueado, o Bot irá automaticamente desativar as notificações para o usuário.

Para ver todos os comandos, utilize /ajuda.    

`

const stopMsg = `
🛑 Inscrição Cancelada 🛑 

Você não receberá mais atualizações. Obrigado por usar o bot!

<i>Psiu!</i> Dica:
- Caso queira desativar as atualizações baseado em um horário específico, você pode usar o comando /horario;
- Caso esteja recebendo muitas notificações você pode usar o comando /intervalo.
Para mais informações, digite /ajuda.
`

const helpMsg = `
<b>/start</b> - Inicia a inscrição para atualizacoes (caso nao inscrito), e envia o numero atual de casos.

<b>/stop</b> - Desativa a inscrição

<b>/intervalo</b> <i>[minutos]</i> - diminua a frequência de mensagens. Por exemplo, <code>/intervalo 45</code> garante que você não irá receber duas mensagens seguidas em um período de 45 minutos. Para voltar ao padrão, utilize <code>/intervalo 0</code>

<b>/horario</b> <i>[comeco] [fim]</i> - Restrinja as atualizações a uma faixa de horario. Por exemplo, <code>/horario 8 14</code> receberá mensagens apenas entre as 8h e as 13:59:59h. Para voltar ao padrao, use <code>/horario 0 24.</code>

<b>/estados_casos</b> - Exibe a contagem de casos para cada estado.

<b>/estados_obitos</b> - Exibe a contagem de óbitos para cada estado.

<b>/contato</b> <i>[mensagem com varias palavras]</i>  - Envia uma mensagem privada para a equipe do Bot e Contagem. Use para deixar opiniões, sugestões e críticas.

<b>/add_canal</b> <i>[nome-do-canal]</i> - ⚠ <b>(Experimental)</b> Configura o Bot para canais do Telegram. Obs: Lembre-se de adicioná-lo como admin do canal.

<b>/usuarios</b> - Número de usuários utilizando esse bot.  

<b>/ajuda</b> - Exibe esta mensagem.
`

const usersMsg = (total, unreachable) => `
👩‍🦰 ${total} usuários 👨
` + (unreachable > 0 ? `
- ⚠ Usuários inalcançáveis: ${unreachable}.

* Inalcançáveis incluem usuários (ou grupos) que bloquearam o Bot. Serão excluídos após 2 tentativas de notificação.
` : ``)

const faq = `
<b> Como é feita a contagem? </b>

<b>* Ministério da Saúde:</b> A contagem é a mesma da plataforma oficial http://plataforma.saude.gov.br/novocoronavirus/#COVID-19-brazil. 
O governo costuma atualizar os casos e óbitos 1 vez por dia.

<b>* Secretarias e Municípios:</b> A contagem é feita por uma equipe através das notícias divulgadas na mídia, em sites de secretarias estaduais e municipais.
Por essa razão, é atualizada com mais frequencia. Pode conter duplicidade de casos ou ausência deles. Dados de óbitos não são estimativas, mas sim obtidos pela plataforma oficial. 

Agradecimentos a https://twitter.com/CoronavirusBra1, https://twitter.com/wlcota, e https://twitter.com/PokeCorona pelo esforço em manter a contagem atualizada.
`;

const noAdminConfigured = `
❌ <b>Erro:</b> Configurar primeiro <b>ADMIN_ID</b>
`

const notAuthorized = `
❌ <b>Erro:</b> Não autorizado!
`

const addChannelAttempt = ({channel}) => `
Tentando conectar ao canal <b>${channel}</b>

ℹ️ <b>Importante:</b> Lembre-se de adicionar @coronavirusbrbot como <b>Administrador</b> no canal <b>${channel}</b>.     
`

const channelAlreadySubscribed = ({channel}) => `
❌ <b>Erro:</b> O canal <b>${channel}</b> já está inscrito no Bot.

ℹ️ <b>Importante:</b> Lembre-se de adicionar @coronavirusbrbot como <b>Administrador</b> no canal <b>${channel}</b>. 

ℹ️ <b>Dica:</b> Caso queira parar as notificações do bot em ${channel}, basta remove-lo do canal. Obrigado!     
            
            `

const activateChannel = ({channel}) => `<b>CoronavirusBRBot:</b> Ativando Notificações para este Canal (${channel})`

const channelSubscribed = ({channel}) => `
✅ <b>Sucesso!</b> Conectado ao canal <b>${channel}</b>

ℹ️ <b>Dica:</b> Caso queira parar as notificações do bot em ${channel}, basta remove-lo do canal. Obrigado!     
`

const channelConnectError = ({channel}) => `
❌ <b>Erro:</b> Nao consegui me conectar ao canal <b>${channel}</b>

ℹ️ <b>Importante:</b> Lembre-se de adicionar @coronavirusbrbot como <b>Administrador</b> no canal <b>${channel}</b>.     
`

const stateCases = ({resultSheets, lastSheetsUpdate}) => `
<b> Casos nos Estados: </b>
<pre>
${resultSheets}
</pre>
* Dados atualizados em ${lastSheetsUpdate}

Para mais informações, digite /faq
`

const stateDeaths = ({result, lastWCotaUpdateTime}) => `
<b> Óbitos nos Estados: </b>
<pre>
${result}
</pre>
* Dados atualizados em ${lastWCotaUpdateTime}

Para mais informações, digite /faq
`

const contactThankYou = `
Obrigado por entrar em contato conosco. Suas sugestões, críticas e opiniões valem muito para nós.
Sua mensagem foi enviada com sucesso.   
`

/* TODO: 
    - Recuperados: <b>${lastSheetsTotalRecovered}</b>
*/

const startCount = ({
    lastSheetsCasesCount, lastSheetsUpdate, lastMSCasesCount, lastMSDeathsValue, lastMSUpdate, 
    iValue, iStartHour, iEndHour, userUnofficialCases, userMSCases, userMSDeaths,
    lastSheetsTotalSuspects, lastSheetsTotalRecovered,
    userSuspects, userRecovered
}) => `
Contagem no <b>Brasil:</b> 🇧🇷

<b>- Secretarias e Municípios:</b>
    - Casos: <b>${lastSheetsCasesCount}</b>${userUnofficialCases !== lastSheetsCasesCount ? ` ❗(${lastSheetsCasesCount - userUnofficialCases} novos)`: ``}
    - Suspeitos: <b>${lastSheetsTotalSuspects}</b>

<b>- Ministério da Saúde (oficial):</b> 
    - Casos: <b>${lastMSCasesCount}</b>${userMSCases !== lastMSCasesCount ? ` ❗(${lastMSCasesCount - userMSCases} novos)`: ``}
    - Óbitos: <b>${lastMSDeathsValue}</b>${(parseInt(userMSDeaths) < parseInt(lastMSDeathsValue)) ? ` ❗(${lastMSDeathsValue - userMSDeaths} novos) 😔`: ``}

<b>- Estados:</b>  /estados   
    - Casos: /estados_casos
    - Óbitos: /estados_obitos    

<b>- Gráficos:</b>  /graficos    
`
+
`
* S&M: Dados atualizados em ${lastSheetsUpdate}
* MS: ${lastMSUpdate} 
* Para detalhes, use /faq

`        
+ 
(iValue ? `
🔄 Freq. mínima de notificação: ${iValue} minutos.` : `🔄 Freq. mínima de notificação: instantânea.`) + (iStartHour ? `
⏰ Notificações restritas ao período ${iStartHour}h-${iEndHour}.
`: `
⏰ Notificações irrestritas (0h-24h).
`)

const graphCaption = (time) => `<b>Gráfico de Casos no Brasil</b>

* Imagem capturada em ${time}. Veja o gráfico interativo na fonte.

<b>- Créditos: </b> Wesley Cota
<b>- Fonte:</b> https://labs.wesleycota.com/sarscov2/br/`;

const mapCaption = (time) => `<b>Mapa de Casos no Brasil</b>

* Imagem capturada em ${time}. Veja o mapa interativo na fonte.

<b>- Créditos: </b> Wesley Cota
<b>- Fonte:</b> https://labs.wesleycota.com/sarscov2/br/`;

module.exports = {
    startMsg,
    stopMsg,
    helpMsg,
    usersMsg,
    faq,
    noAdminConfigured,
    notAuthorized,
    addChannelAttempt,
    channelAlreadySubscribed,
    activateChannel,
    channelSubscribed,
    stateCases,
    stateDeaths,
    contactThankYou,
    startCount,
    graphCaption,
    mapCaption
}