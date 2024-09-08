import { readFileSync } from "fs";
import { Pub } from "./pub";
import { resolve } from "path";

const endingTime = process.argv[2] ? parseInt(process.argv[2]) : 100;
const stats = process.argv[3] === 'stats';
const log = process.argv[4] === 'log';

const readData = (table: string) => readFileSync(resolve(__dirname, `../data/${table}`), 'utf-8').split('\n').map(Number);

const arrivals = readData('table_3_6');
const thirsts = readData('table_3_7');
const drinkingTimes = readData('table_3_8');
const servingTimes = readData('table_3_9');

if(arrivals.length !== thirsts.length || thirsts.length !== drinkingTimes.length || drinkingTimes.length !== servingTimes.length) {
    throw new Error(`All tables must have the same length. Got ${arrivals.length}, ${thirsts.length}, ${drinkingTimes.length}, ${servingTimes.length}`);
}

const pub = new Pub(arrivals, servingTimes, drinkingTimes, thirsts, log);


if(stats){
    pub.printStats();
}
while(pub.currentTick < endingTime) {
    pub.tick();
    if(stats){
        pub.printStats();
    }
}

console.log(pub.analyze());
