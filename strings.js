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

<b>/estados</b> - Tabela interativa resumida para os estados.

<b>/graficos</b> - Exibe gráficos relacionados a contagem de casos.

<b>/leitos_insumos</b> - Exibe informações relacionadas a contagem de leitos e insumos estratégicos para o governo.

<b>/faq</b> - Exibe perguntas frequentes, especialmente sobre as fontes consultadas.

<b>/contato</b> <i>[mensagem com varias palavras]</i>  - Envia uma mensagem privada para a equipe do Bot e Contagem. Use para deixar opiniões, sugestões e críticas.

<b>/add_canal</b> <i>[nome-do-canal]</i> - ⚠ <b>(Experimental)</b> Configura o Bot para canais do Telegram. Obs: Lembre-se de adicioná-lo como admin do canal.

<b>/usuarios</b> - Número de usuários utilizando esse bot.  

<b>/ajuda</b> - Exibe esta mensagem.
`

const usersMsg = (total, unreachable, {channels, people, groups, membersCount, maxCount}) => `
👩‍🦰 ${total} usuários 👨
` + (unreachable > 0 ? `
- ⚠ Usuários inalcançáveis: ${unreachable}.

* Inalcançáveis incluem usuários (ou grupos) que bloquearam o Bot. Serão excluídos após 2 tentativas de notificação.
` : ``)
+
`
- Pessoas: ${people}
- Grupos: ${groups}
- Canais: ${channels}

- Indiretos: ${membersCount}
- Grupo/Canal mais popular: ${maxCount}`

const faq = `
<b> Como é feita a contagem? </b>

<b>* Ministério da Saúde:</b> A contagem é a mesma da plataforma oficial http://plataforma.saude.gov.br/novocoronavirus/#COVID-19-brazil. 
O governo costuma atualizar os casos e óbitos 1 vez por dia.

<b>* Secretarias e Municípios:</b> A contagem é feita por uma equipe através das notícias divulgadas na mídia, em sites de secretarias estaduais e municipais.
Por essa razão, é atualizada com mais frequencia. Pode conter duplicidade de casos ou ausência deles. Dados de óbitos não são estimativas, mas sim obtidos pela plataforma oficial. 

Agradecimentos a https://twitter.com/CoronavirusBra1, https://twitter.com/wlcota, e https://twitter.com/PokeCorona pelo esforço em manter a contagem atualizada.

<b>* Worldometers:</b> Site internacional que realiza a coleta de dados relacionados ao COVID-19: https://www.worldometers.info/coronavirus/

<b>* Cartórios:</b> Site da Associação Nacional dos Registradores de Pessoas Naturais (Arpen-Brasil). https://transparencia.registrocivil.org.br/especial-covid
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

const stateSuspects = ({resultSheets, lastSheetsUpdate}) => `
<b> Suspeitos nos Estados: </b>
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
    userSuspects, userRecovered,
    lastWMCount, lastWMDeaths, lastWMRecovered, lastWMUpdate,
    userWMCount, userWMDeaths, userWMRecovered, detailed = true,
    lastRegistryDeaths, lastSheetsTotalDeaths, lastSheetsTotalTests, lastMSRecovered,
    userSheetsDeaths, userSheetsTests, userRegistryDeaths
}) => `
Contagem no <b>Brasil:</b> 🇧🇷 (/faq)

▪ Secretarias e Municípios:
    - Casos: <b>${formatNumber(lastSheetsCasesCount)}</b>${userUnofficialCases < lastSheetsCasesCount ? ` ❗(${formatNumber(lastSheetsCasesCount - userUnofficialCases)} novos)`: ``}
    - Óbitos: <b>${formatNumber(lastSheetsTotalDeaths)}</b>${((userSheetsDeaths !== null) && (userSheetsDeaths < lastSheetsTotalDeaths)) ? ` ❗(${formatNumber(lastSheetsTotalDeaths - userSheetsDeaths)} novos) 😔`: ``}
    - Suspeitos: <b>${formatNumber(lastSheetsTotalSuspects)}</b>${userSuspects !== lastSheetsTotalSuspects ? ` ❗(${formatNumber(lastSheetsTotalSuspects - userSuspects)} novos)`: ``}
    - Recuperados: <b>${formatNumber(lastSheetsTotalRecovered)}</b>${(userRecovered < lastSheetsTotalRecovered) ? ` ❗(${formatNumber(lastSheetsTotalRecovered - userRecovered)} novos) 🎉`: ``}
    - Testes: <b>${formatNumber(lastSheetsTotalTests)}</b>${((typeof userSheetsTests === 'number') && (userSheetsTests !== lastSheetsTotalTests)) ? ` ❗(${formatNumber(lastSheetsTotalTests - userSheetsTests)} novos)`: ``}

▫ Ministério da Saúde (oficial):
    - Casos: <b>${formatNumber(parseInt(lastMSCasesCount, 10))}</b>${userMSCases !== lastMSCasesCount ? ` ❗(${formatNumber(lastMSCasesCount - userMSCases)} novos)`: ``}
    - Óbitos: <b>${formatNumber(parseInt(lastMSDeathsValue, 10))}</b>${(parseInt(userMSDeaths) < parseInt(lastMSDeathsValue)) ? ` ❗(${formatNumber(lastMSDeathsValue - userMSDeaths)} novos) 😔`: ``}
    - Recuperados: <b>${formatNumber(lastMSRecovered)}</b>

🔅 Worldometers:
    - Casos: <b>${formatNumber(lastWMCount)}</b>${(userWMCount < lastWMCount) ? ` ❗(${formatNumber(lastWMCount - userWMCount)} novos)`: ``}
    - Óbitos: <b>${formatNumber(lastWMDeaths)}</b>${(userWMDeaths < lastWMDeaths) ? ` ❗(${formatNumber(lastWMDeaths - userWMDeaths)} novos) 😔`: ``}
    - Recuperados: <b>${formatNumber(lastWMRecovered)}</b>${(userWMRecovered < lastWMRecovered) ? ` ❗(${formatNumber(lastWMRecovered - userWMRecovered)} novos) 🎉`: ``}   

▪ Cartórios:
    - Óbitos: <b>${formatNumber(lastRegistryDeaths)}</b> ${((userRegistryDeaths !== null) && (userRegistryDeaths < lastRegistryDeaths)) ? `❗ `: ``}(${((userRegistryDeaths !== null) && (userRegistryDeaths < lastRegistryDeaths)) ? `${lastRegistryDeaths - userRegistryDeaths} novos, `: ``}Inclui suspeitos) ${((userRegistryDeaths !== null) && (userRegistryDeaths < lastRegistryDeaths)) ? `😔`: ``}
`
+ `
`       
+ 
(iValue ? `🔄 ${iValue} min. ` : `🔄 (0 min). `) + (iStartHour ? `⏰ ${iStartHour}h-${iEndHour}
`: `⏰ (0h-24h)`)

const graphCaption = (time) => `<b>Gráfico de Casos no Brasil</b>

* Imagem capturada em ${time}. Veja o gráfico interativo na fonte.

<b>- Créditos: </b> Wesley Cota
<b>- Fonte:</b> https://covid19br.wcota.me/`;

const sdGraphCaption = (time) => `<b>Gráfico de Isolamento Social no Brasil</b>

* Imagem capturada em ${time}. Veja o gráfico interativo na fonte.

<b>- Créditos: </b> In Loco
<b>- Fonte:</b> https://mapabrasileirodacovid.inloco.com.br/pt/`;

const sdRankingCaption = (time) => `<b>Ranking de Isolamento Social no Brasil</b>

* Imagem capturada em ${time}. Veja o gráfico interativo na fonte.

<b>- Créditos: </b> In Loco
<b>- Fonte:</b> https://mapabrasileirodacovid.inloco.com.br/pt/`;

const mapCaption = (time) => `<b>Mapa de Casos no Brasil</b>

* Imagem capturada em ${time}. Veja o mapa interativo na fonte.

<b>- Créditos: </b> Wesley Cota
<b>- Fonte:</b> https://covid19br.wcota.me/`;

const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100

/** Format according to Brazilian standards */
const formatNumber = n => n.toLocaleString('pt-br');

const bedsAndSupplies = ({
    distributedVaccines,
    usedVaccines,
    surgeryMasks,
    n95Masks,
    alcohol,
    apron,
    quickTestKits,
    gloves,
    protectiveGlasses,
    sneakersAndCaps,
    tempBeds,
    icuBeds      
}) => {
    return `<b>Leitos e Insumos</b>

- Leitos Totais: <b>${formatNumber(tempBeds + icuBeds)}</b>
    - UTI Adulto: ${formatNumber(icuBeds)}
    - Temporários: ${formatNumber(tempBeds)}

- Kit Teste Rápido: <b>${formatNumber(quickTestKits)}</b>

- Vacinas contra a Gripe:
    - Aplicadas: ${formatNumber(usedVaccines)} <b>(${formatNumber(round(usedVaccines/distributedVaccines * 100))}%)</b>
    - Distribuídas: ${formatNumber(distributedVaccines)}

- Máscaras:
    - Cirúrgicas: <b>${formatNumber(surgeryMasks)}</b>
    - N95: <b>${formatNumber(n95Masks)}</b>

- Álcool 100/500ml: <b>${formatNumber(alcohol)}</b>

- Avental: <b>${formatNumber(apron)}</b>

- Luvas: <b>${formatNumber(gloves)}</b>

- Óculos de Proteção: <b>${formatNumber(protectiveGlasses)}</b>

- Sapatilha e Touca: <b>${formatNumber(sneakersAndCaps)}</b>

Para detalhes por estado, veja a fonte (site oficial do Ministério da Saúde).
`
}

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
    stateSuspects,
    contactThankYou,
    startCount,
    graphCaption,
    mapCaption,
    bedsAndSupplies,
    sdGraphCaption,
    sdRankingCaption
}