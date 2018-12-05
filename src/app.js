// @flow strict

import checkEnvs from "./checkEnvs";
import server from "./server";

checkEnvs();

server.listen(process.env.PORT);
