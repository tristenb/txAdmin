//Requires
const xss = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../../extras/console');
const webUtils = require('./../../webUtils.js');
const context = 'WebServer:Experiments-Players-Get';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const handleError = async (res, req, error)=>{
    logError(`Failed to read the players from the database with error: ${error.message}`, context);
    if(globals.config.verbose) dir(error);
    let message = `Error loading this experimental page, please copy the error on the terminal and report in the Discord Server.`;
    let out = await webUtils.renderMasterView('basic/generic', req.session, {message});
    return res.send(out);
}

/**
 * Returns the output page containing the bans experiment
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
	let dbo = globals.database.getDB();
	let players = dbo.get("experiements.players.playerList").value();

    //Check permissions
    if(!webUtils.checkPermission(req, 'all', context)){
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    //Getting the database data
    let isEnabled;
    let playerList;
    try {
        let dbo = globals.database.getDB();
        isEnabled = await dbo.get("experiments.players.enabled").value();
        playerList = await dbo.get("experiments.players.playerList").value();
    } catch (error) {
        return await handleError(res, req, error);
    }

    //Checking if enabled
    if(!isEnabled){
        let renderData = {
            headerTitle: 'Players',
            expEnabled: false,
            log: ""
        }
        let out = await webUtils.renderMasterView('experiments/players', req.session, renderData);
        return res.send(out);
    }

    //Prepares the log
    let log = processLog(playerList);
    if(log === false) return await handleError(res, req, new Error('experiments.players.playerList is not an array'));

    let renderData = {
        headerTitle: 'Players',
        expEnabled: true,
        log
    }

    let out = await webUtils.renderMasterView('experiments/players', req.session, renderData);
    return res.send(out);

};

//================================================================
/**
 * Returns the Processed Log.
 * @param {array} playerList
*/
function processLog(playerList){
    if(!Array.isArray(playerList)) return false;

    let out = '';
    playerList.forEach(player => {
        if(
            isUndefined(player.timestamp) ||
            isUndefined(player.banned_by) ||
            isUndefined(player.identifier) ||
            isUndefined(player.reason)
        ){
            return;
        }
        let time = new Date(parseInt(player.timestamp)*1000).toLocaleTimeString()
        out += `<li><a href="/experiments/players#!" data-player-identifier="${xss(player.identifier)}" class="text-primary unban-btn">[unban]</a>
                    [${time}] <code>${xss(player.identifier)}</code> - ${xss(player.reason)} (${xss(player.banned_by)})</li>\n`;
    });

    return out;
}
