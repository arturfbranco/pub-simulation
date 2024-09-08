export class Client {
    
    constructor(
        public arrivalTime: number,
        public thirst: number,
        public drinkingTime: number,
        public servingTime: number,
        public waitingTime: number = 0
    ){}


}