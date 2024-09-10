import { createCanvas } from "canvas";
import { PubStats } from "./pub";
import { BarController, BarElement, CategoryScale, Chart, ChartConfiguration, LineController, LineElement, LinearScale, PointElement } from "chart.js";
import { WaitressState } from "./waitress";
import { createWriteStream } from "fs";
import { resolve } from "path";

const WIDTH = 10000;
const HEIGHT = 3000;

const numberToState = {
    0: WaitressState.AVAILABLE,
    1: WaitressState.SERVING,
    2: WaitressState.WASHING,
};

const stateToNumber = {
    [WaitressState.AVAILABLE]: 0,
    [WaitressState.SERVING]: 1,
    [WaitressState.WASHING]: 2,
};


export function report(pubStats: PubStats): void {
    const waitress1States = pubStats.history.map((pubState) => pubState.waitress[0]).map((state) => stateToNumber[state]);
    const waitress2States = pubStats.history.map((pubState) => pubState.waitress[1]).map((state) => stateToNumber[state]);



    const measureChartConfig: ChartConfiguration = {
        type: "bar",
        data: {
            labels: ["Number of clients", "Average waiting time", "Available average time", "Serving average time", "Washing average time"],
            datasets: [
                {
                    label: "Pub Stats",
                    data: [
                        pubStats.numberOfClients,
                        pubStats.averageWaitingTime,
                        pubStats.availableAverageTime,
                        pubStats.servingAverageTime,
                        pubStats.washingAverageTime
                    ],
                    backgroundColor: ["red", "blue", "green", "purple", "orange"],
                },
            ],
        },
    };


    const historyChartConfig: ChartConfiguration = {
        type: "line",
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                yLeft: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Amount'
                    }
                },
                yRight: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Waitress State'
                    },
                    ticks: {
                        stepSize: 1,
                        callback: (value) => numberToState[value as keyof typeof numberToState],
                    }
                }
            }
        },
        data: {
            labels: pubStats.history.map((pubState) => pubState.currentTick),
            datasets: [
                {
                    label: "Number of clients",
                    data: pubStats.history.map((pubState) => pubState.line),
                    borderColor: "red",
                    fill: false,
                    yAxisID: 'yLeft'
                },
                {
                    label: "Clients waiting in bar",
                    data: pubStats.history.map((pubState) => pubState.waitingInBar),
                    borderColor: "blue",
                    fill: false,
                    yAxisID: 'yLeft'
                },
                {
                    label: "Clients drinking",
                    data: pubStats.history.map((pubState) => pubState.drinking),
                    borderColor: "green",
                    fill: false,
                    yAxisID: 'yLeft'
                },
                {
                    label: "Dirty cups",
                    data: pubStats.history.map((pubState) => pubState.dirtyCups),
                    borderColor: "purple",
                    fill: false,
                    yAxisID: 'yLeft'
                },
                {
                    label: "Waitress 1",
                    data: waitress1States,
                    borderColor: "orange",
                    fill: false,
                    yAxisID: 'yRight'
                },
                {
                    label: "Waitress 2",
                    data: waitress2States,
                    borderColor: "yellow",
                    fill: false,
                    yAxisID: 'yRight'
                }
            ],
        }
    }




    Chart.register(BarController, LineController, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

    const canvasMeasures = createCanvas(WIDTH, HEIGHT);
    const contextMeasures = canvasMeasures.getContext("2d");
    new Chart(contextMeasures as any, measureChartConfig);
    const outFile = createWriteStream(resolve(__dirname, '../output-measures.png'));
    const stream = canvasMeasures.createPNGStream();
    stream.pipe(outFile);
    outFile.on('finish', () => console.log('The file was created.'));

    const canvasHistory = createCanvas(WIDTH, HEIGHT);
    const contextHistory = canvasHistory.getContext("2d");
    new Chart(contextHistory as any, historyChartConfig);
    const outFile2 = createWriteStream(resolve(__dirname, '../output-history.png'));
    const stream2 = canvasHistory.createPNGStream();
    stream2.pipe(outFile2);
    outFile2.on('finish', () => console.log('The file was created.'));
}