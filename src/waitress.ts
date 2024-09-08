export enum WaitressState {
    AVAILABLE = "AVAILABLE",
    SERVING = "SERVING",
    WASHING = "WASHING"
}

export class Waitress {
    public state: WaitressState = WaitressState.AVAILABLE;
    public busyTime: number = 0;

    public serve(servingTime: number): void {
        this.state = WaitressState.SERVING;
        this.busyTime = servingTime;
    }

    public wash(): void {
        this.state = WaitressState.WASHING;
        this.busyTime = 5;
    }
}