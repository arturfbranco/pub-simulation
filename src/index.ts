import { Pub } from "./pub";
import { report } from "./report";

const endingTime = process.argv[2] ? parseInt(process.argv[2]) : 100;
const totalClients = parseInt(process.argv[3]) || Math.floor(Math.random() * 100) + 1;
const stats = process.argv[4] === 'stats';
const log = process.argv[5] === 'log';

const pub = new Pub(totalClients, log);


if(stats){
    pub.printStats();
}
while(pub.currentTick < endingTime) {
    pub.tick();
    if(stats){
        pub.printStats();
    }
}

const pubStats = pub.analyze();

const { numberOfClients, averageWaitingTime, availableAverageTime, servingAverageTime, washingAverageTime, history } = pubStats;

const reportData = {
    numberOfClientsOutOfBar: numberOfClients,
    numberOfClientsInside: history[endingTime].clientsInside,
    averageWaitingTime: `${averageWaitingTime.toFixed(2)} / ${((Number(averageWaitingTime.toFixed(2)) / history.length) * 100).toFixed(2)}%`,
    availableAverageTime: `${availableAverageTime.toFixed(2)} / ${((Number(availableAverageTime.toFixed(2)) / history.length) * 100).toFixed(2)}%`,
    servingAverageTime: `${servingAverageTime.toFixed(2)} / ${((Number(servingAverageTime.toFixed(2)) / history.length) * 100).toFixed(2)}%`,
    washingAverageTime: `${washingAverageTime.toFixed(2)} / ${((Number(washingAverageTime.toFixed(2)) / history.length) * 100).toFixed(2)}%`,
}

console.log(reportData);

report(pubStats);

