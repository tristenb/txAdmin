//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../../extras/console');
const webUtils = require('./../../webUtils.js');
const context = 'WebServer:Experiments-Players-Actions';

//Helper functions
const escape = (x) => {return x.replace(/\"/g, '\\"');};
const isUndefined = (x) => { return (typeof x === 'undefined') };
const handleError = async (res, req, error)=>{
    logError(`Database operation failed with error: ${error.message}`, context);
    if(globals.config.verbose) dir(error);
    return res.send({
        type: 'danger',
        message: `Error executing this action, please copy the error on the terminal and report in the Discord Server.`
    });
}

/**
 * Returns the output page containing the bans experiment
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.action)){
        return res.status(400).send({error: "Invalid Request"});
    }
    let action = req.params.action;


    //Check permissions
    if(!webUtils.checkPermission(req, 'all', context)){
        return res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Delegate to the specific action handler
    if(action === 'enable' || action === 'disable'){
        return await handleEnableDisable(res, req);
    }else{
        return res.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};

//================================================================
/**
 * Handle EnableDisable
 * @param {object} res
 * @param {object} req
 */
async function handleEnableDisable(res, req) {
    try {
        let desiredStatus = (req.params.action === 'enable');
        let dbo = globals.database.getDB();
        await dbo.set("experiments.players.enabled", desiredStatus).write();
    } catch (error) {
        return await handleError(res, req, error);
    }

    return res.redirect('/experiments/players');
}

