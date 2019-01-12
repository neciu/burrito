// @flow strict

import checkEnvs from "./checkEnvs";
import server from "./server";
import { initializeEventStore } from "EventStoreService";

checkEnvs();
initializeEventStore();

server.listen(process.env.PORT);
