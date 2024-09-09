import { Client } from "./client";
import { Waitress, WaitressState } from "./waitress";

export interface PubStats {
    averageWaitingTime: number;
    availableAverageTime: string;
    servingAverageTime: string;
    washingAverageTime: string;
    history: PubState[];
}

export interface PubState {
    currentTick: number;
    waitress: WaitressState[];
    line: number;
    waitingInBar: number;
    drinking: number;
    dirtyCups: number;
}

export class Pub {
    public currentTick: number = 0;
    private dirtyCups: number = 0;
    private waitress: Waitress[] = [new Waitress(), new Waitress()];
    private clients: Client[] = [];
    private line: Client[] = [];
    private waitingInBar: Client[] = [];
    private drinking: Client[] = [];
    private transitionLine: Client[] = []
    private clientsOutOfBar: Client[] = [];
    private stateHistory: PubState[] = [];


    constructor(arrivalTimes: number[], servingTime: number[], drinkingTimes: number[], thirsts: number[], private shouldLog: boolean = false) {
        let absoluteArrivalTime = 0;
        for (let i = 0; i < arrivalTimes.length; i++) {
            this.clients.push(new Client(absoluteArrivalTime + arrivalTimes[i], thirsts[i], drinkingTimes[i], servingTime[i]));
            absoluteArrivalTime += arrivalTimes[i];
        }
    }

    public analyze(): PubStats {
        
        const averageWaitingTime = this.clientsOutOfBar.reduce((acc, client) => acc + client.waitingTime, 0) / this.clientsOutOfBar.length || 0;
        const availableAverageTime = this.waitress.reduce((acc, waitress) => acc + waitress.activityRecords[WaitressState.AVAILABLE], 0) / this.waitress.length;
        const servingAverageTime = this.waitress.reduce((acc, waitress) => acc + waitress.activityRecords[WaitressState.SERVING], 0) / this.waitress.length;
        const washingAverageTime = this.waitress.reduce((acc, waitress) => acc + waitress.activityRecords[WaitressState.WASHING], 0) / this.waitress.length;
        return {
            averageWaitingTime,
            availableAverageTime: `${availableAverageTime} / ${(availableAverageTime / this.currentTick) * 100}%`,
            servingAverageTime: `${servingAverageTime} / ${(servingAverageTime / this.currentTick) * 100}%`,
            washingAverageTime: `${washingAverageTime} / ${(washingAverageTime / this.currentTick) * 100}%`,
            history: this.stateHistory
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
        this.handleTransitionLine();
        this.handleClientsDrinking();
        this.handleWaitressesBusyTime();
        this.handleWashing();
        this.handleClientsWaitingAtBar();
        this.handleClientsWaitingInLine();
        this.handleNewClients();
        this.updateWaitressesActivityRecords();
        this.storeTickState();
    }

    private handleTransitionLine(): void {
        this.log(`Moving clients from transition line to line: ${this.transitionLine.length}`);
        this.line = this.line.concat(this.transitionLine);
        this.transitionLine = [];
    }

    private handleClientsDrinking(): void {
        this.log(`Clients drinking time: ${this.drinking.map(client => client.drinkingTime)}`);
        this.drinking.filter((client) => client.drinkingTime > 0).forEach((client) => client.drinkingTime--);
        const finishedDrinking = this.drinking.filter(client => client.drinkingTime === 0);
        this.log(`Clients finished drinking: ${finishedDrinking.length}. Dirty cups: ${this.dirtyCups}`);
        finishedDrinking.forEach(client => {
            this.dirtyCups++;
            client.thirst--;
            if(client.thirst > 0) {
                this.transitionLine.push(client);
            } else {
                this.log(`Client left the pub`);
                this.clientsOutOfBar.push(client);
            }
            this.drinking.splice(this.drinking.indexOf(client), 1);
        });
    }

    private handleWaitressesBusyTime(): void {
        this.waitress.filter((waitress) => waitress.busyTime > 0).forEach((waitress) => waitress.busyTime--);
        this.log(`Waitressess busy time: ${this.waitress.map(waitress => waitress.busyTime)}`);
        this.waitress.filter(waitress => waitress.busyTime === 0).forEach(waitress => waitress.state = WaitressState.AVAILABLE);
        this.log(`Available waitressess: ${this.waitress.filter(waitress => waitress.state === WaitressState.AVAILABLE).length}`);
    }

    private handleWashing(): void {
        let availableWaitress = this.waitress.find(waitress => waitress.state === WaitressState.AVAILABLE);
        if(availableWaitress && this.dirtyCups >= 10) {
            this.log(`Setting waitress to wash`);
            availableWaitress.wash();
            this.dirtyCups -= 10;
        }
    }

    private handleClientsWaitingAtBar(): void {
        this.waitingInBar.filter((client) => client.servingTime > 0).forEach((client) => client.servingTime--);
        this.log(`Clients waiting in bar: ${this.waitingInBar.length}. Waiting times: ${this.waitingInBar.map(client => client.servingTime)}`);
        this.waitingInBar.filter(client => client.servingTime === 0).forEach(client => {
            this.drinking.push(client);
            this.waitingInBar.splice(this.waitingInBar.indexOf(client), 1);
        })
    }

    private handleClientsWaitingInLine(): void {
        this.line.forEach((client) => client.waitingTime++);
        const availableWaitressess = this.waitress.filter(waitress => waitress.state === WaitressState.AVAILABLE);
        availableWaitressess.forEach(waitress => {
            const client = this.line.shift();
            if(client) {
                this.log(`Waitress serving client`);
                waitress.serve(client.servingTime);
                this.waitingInBar.push(client);
            }
        });
    }

    private handleNewClients(): void {
        this.clients.filter(client => client.arrivalTime === this.currentTick).forEach(client => {
            this.log(`Client arrived`);
            this.line.push(client);
            this.clients.splice(this.clients.indexOf(client), 1);
        });
    }

    private updateWaitressesActivityRecords(): void {
        this.waitress.forEach(waitress => waitress.updateActivityRecords());
    }

    private log(msg: string): void {
        if(this.shouldLog){
            console.log(`[ LOG ] ${msg}`);
        }
    }

    private storeTickState(): void {
        this.stateHistory.push({
            currentTick: this.currentTick,
            waitress: this.waitress.map(waitress => waitress.state),
            line: this.line.length,
            waitingInBar: this.waitingInBar.length,
            drinking: this.drinking.length,
            dirtyCups: this.dirtyCups
        });
    }
}