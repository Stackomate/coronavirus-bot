const main = async () => {
    addToLog(await require('./unofficial')());
}

main();