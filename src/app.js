// @flow strict

import checkEnvs from "checkEnvs";
import myserver from "myserver";
import { initializeEventStore } from "EventStoreService";

checkEnvs();
initializeEventStore();

myserver.listen(process.env.PORT);
