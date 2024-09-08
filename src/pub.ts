import { Client } from "./client";
import { Waitress, WaitressState } from "./waitress";

export class Pub {
    public currentTick: number = 0;
    private dirtyCups: number = 0;
    private waitress: Waitress[] = [new Waitress(), new Waitress()];
    private clients: Client[] = [];
    private line: Client[] = [];
    private waitingInBar: Client[] = [];
    private drinking: Client[] = [];
    private transitionLine: Client[] = []


    constructor(arrivalTimes: number[], servingTime: number[], drinkingTimes: number[], thirsts: number[], private shouldLog: boolean = false) {
        let absoluteArrivalTime = 0;
        for (let i = 0; i < arrivalTimes.length; i++) {
            this.clients.push(new Client(absoluteArrivalTime + arrivalTimes[i], thirsts[i], drinkingTimes[i], servingTime[i]));
            absoluteArrivalTime += arrivalTimes[i];
        }
    }

    public printStats(): void {
        const stats = `
        T: ${this.currentTick}
        Clients in line: ${this.line.length}
        Clients waiting in bar: ${this.waitingInBar.length}
        Clients drinking: ${this.drinking.length}
        Dirty cups: ${this.dirtyCups}
        Waitressess: ${this.waitress.map(waitress => waitress.state)}
        `;
        console.log(stats);
    }

    public tick(): void {

        this.currentTick++;

        this.log(`Moving clients from transition line to line: ${this.transitionLine.length}`);
        this.line = this.line.concat(this.transitionLine);
        this.transitionLine = [];

        this.log(`Clients drinking time: ${this.drinking.map(client => client.drinkingTime)}`);
        this.drinking.filter((client) => client.drinkingTime > 0).forEach((client) => client.drinkingTime--);
        const finishedDrinking = this.drinking.filter(client => client.drinkingTime === 0);
        this.log(`Clients finished drinking: ${finishedDrinking.length}. Dirty cups: ${this.dirtyCups}`);
        finishedDrinking.forEach(client => {
            this.dirtyCups++;
            client.thirst--;
            if(client.thirst > 0) {
                this.transitionLine.push(client);
            }
            this.drinking.splice(this.drinking.indexOf(client), 1);
        });

        this.waitress.filter((waitress) => waitress.busyTime > 0).forEach((waitress) => waitress.busyTime--);
        this.log(`Waitressess busy time: ${this.waitress.map(waitress => waitress.busyTime)}`);

        this.waitress.filter(waitress => waitress.busyTime === 0).forEach(waitress => waitress.state = WaitressState.AVAILABLE);

        this.log(`Available waitressess: ${this.waitress.filter(waitress => waitress.state === WaitressState.AVAILABLE).length}`);

        let availableWaitress = this.waitress.find(waitress => waitress.state === WaitressState.AVAILABLE);
        if(availableWaitress && this.dirtyCups >= 10) {
            this.log(`Setting waitress to wash`);
            availableWaitress.wash();
            this.dirtyCups -= 10;
        }

        this.waitingInBar.filter((client) => client.servingTime > 0).forEach((client) => client.servingTime--);
        this.log(`Clients waiting in bar: ${this.waitingInBar.length}. Waiting times: ${this.waitingInBar.map(client => client.servingTime)}`);
        this.waitingInBar.filter(client => client.servingTime === 0).forEach(client => {
            this.drinking.push(client);
            this.waitingInBar.splice(this.waitingInBar.indexOf(client), 1);
        })



        const availableWaitressess = this.waitress.filter(waitress => waitress.state === WaitressState.AVAILABLE);
        availableWaitressess.forEach(waitress => {
            const client = this.line.shift();
            if(client) {
                this.log(`Waitress serving client`);
                waitress.serve(client.servingTime);
                this.waitingInBar.push(client);
            }
        });

        this.clients.filter(client => client.arrivalTime === this.currentTick).forEach(client => {
            this.log(`Client arrived`);
            this.line.push(client);
            this.clients.splice(this.clients.indexOf(client), 1);
        });
    }

    private log(msg: string): void {
        if(this.shouldLog){
            console.log(`[ LOG ] ${msg}`);
        }
    }
}