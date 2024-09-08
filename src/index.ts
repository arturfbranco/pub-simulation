import { Pub } from "./pub";

const endingTime = 50;
const log = false;

// Arrivals
const table36 = [1, 10, 15, 6, 2, 2, 2, 1, 11, 0, 5, 13, 6, 0, 11, 5, 1, 20, 4, 12];

// Thirst
const table37 = [4, 2, 1, 2, 2, 1, 2, 2, 1, 2, 4, 1, 3, 3, 4, 4, 1, 2, 4, 1];

// Drinking time
const table38 = [7, 7, 6, 7, 7, 8, 8, 6, 8, 8, 8, 7, 8, 5, 8, 8, 6, 6, 5, 5];

// Serving time
const table39 = [5, 5, 6, 5, 5, 5, 6, 6, 6, 6, 3, 5, 7, 5, 6, 6, 7, 6, 6, 7]

if(table36.length !== table37.length || table37.length !== table38.length || table38.length !== table39.length) {
    throw new Error(`All tables must have the same length. Got ${table36.length}, ${table37.length}, ${table38.length}, ${table39.length}`);
}

const pub = new Pub(table36, table39, table38, table37, log);


pub.printStats();
while(pub.currentTick < endingTime) {
    pub.tick();
    pub.printStats();
}
