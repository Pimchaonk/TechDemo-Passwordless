
import { logger } from "./common.js";
export const handler = async (event) => {
    logger.info("Pre-signup: auto confirming user ...");
    logger.debug(JSON.stringify(event, null, 2));
    event.response.autoConfirmUser = true;
    logger.debug(JSON.stringify(event, null, 2));
    return event;
};
